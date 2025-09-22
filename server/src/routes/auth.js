const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.post("/auth/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // Validate required fields
  if (!username || !password) {
    return res.status(400).json({ 
      error: "Username and password are required" 
    });
  }
  
  // Check credentials 
  if (username === 'teamte09' && password === 'isbest') {
    // Set secure session cookie
    res.cookie('oneParentAuth', 'verified', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });
    
    return res.json({ 
      success: true, 
      message: "Authentication successful" 
    });
  }
  
  // Invalid credentials
  res.status(401).json({ 
    error: "Invalid username or password" 
  });
}));

// Check authentication status
router.get("/auth/status", asyncHandler(async (req, res) => {
  const authCookie = req.cookies.oneParentAuth;
  
  if (authCookie === 'verified') {
    return res.json({ authenticated: true });
  }
  
  res.json({ authenticated: false });
}));



module.exports = router;