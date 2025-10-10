// github webhook receiver for oneparent vic server auto deployment
// listens for push events to main branch and triggers zero downtime deployment

const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

// load webhook secret from environment
const webhookSecret = process.env.WEBHOOK_SECRET || fs.readFileSync('/home/ec2-user/oneparent-vic/webhook/webhook-secret.txt', 'utf8').trim();

// middleware for parsing json
app.use(express.json());

// webhook verification function
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// log function with timestamp
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    
    // also write to deployment log file
    fs.appendFileSync('/home/ec2-user/oneparent-vic/webhook/deployment.log', 
        `[${timestamp}] ${message}\n`);
}

// health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// main webhook endpoint
app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    // verify webhook signature
    if (!signature || !verifySignature(payload, signature)) {
        log('webhook signature verification failed');
        return res.status(401).json({ error: 'unauthorized' });
    }
    
    const event = req.headers['x-github-event'];
    const body = req.body;
    
    log(`received webhook event: ${event}`);
    
    // only process push events
    if (event !== 'push') {
        log(`ignoring non-push event: ${event}`);
        return res.json({ message: 'event ignored' });
    }
    
    // only process main branch
    if (body.ref !== 'refs/heads/main') {
        log(`ignoring push to branch: ${body.ref}`);
        return res.json({ message: 'branch ignored' });
    }
    
    // check if server folder was modified
    const hasServerChanges = body.commits.some(commit => 
        commit.added.some(file => file.startsWith('server/')) ||
        commit.removed.some(file => file.startsWith('server/')) ||
        commit.modified.some(file => file.startsWith('server/'))
    );
    
    if (!hasServerChanges) {
        log('no server folder changes detected, skipping deployment');
        return res.json({ message: 'no server changes' });
    }
    
    log('server changes detected, starting deployment');
    
    // trigger deployment asynchronously
    const deploymentScript = '/home/ec2-user/oneparent-vic/webhook/deploy.sh';
    exec(`bash ${deploymentScript}`, (error, stdout, stderr) => {
        if (error) {
            log(`deployment failed: ${error.message}`);
            log(`deployment stderr: ${stderr}`);
        } else {
            log('deployment completed successfully');
            log(`deployment stdout: ${stdout}`);
        }
    });
    
    res.json({ message: 'deployment triggered' });
});

// error handling middleware
app.use((error, req, res, next) => {
    log(`webhook error: ${error.message}`);
    res.status(500).json({ error: 'internal server error' });
});

// start webhook server
app.listen(port, '127.0.0.1', () => {
    log(`webhook receiver listening on port ${port}`);
});

// graceful shutdown
process.on('SIGTERM', () => {
    log('webhook receiver shutting down');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('webhook receiver shutting down');
    process.exit(0);
});