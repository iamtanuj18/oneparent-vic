'use client';

import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Credentials for simple auth
  const VALID_USERNAME = 'teamte09';
  const VALID_PASSWORD = 'isbest';

  useEffect(() => {
    // Check if already authenticated in this session (no complex timing or localStorage)
    const authStatus = sessionStorage.getItem('oneParentAuth');
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // If not authenticated, show login prompt immediately
    const performLogin = () => {
      const username = window.prompt('🔐 Access Required\n\nThis website is currently under development.\nPlease enter username:');
      
      if (username === null) {
        setIsLoading(false);
        return false;
      }
      
      if (username !== VALID_USERNAME) {
        alert('❌ Invalid username. Please contact team TE09 for access.');
        setIsLoading(false);
        return false;
      }
      
      const password = window.prompt('Please enter password:');
      
      if (password === null) {
        setIsLoading(false);
        return false;
      }
      
      if (password !== VALID_PASSWORD) {
        alert('❌ Invalid password. Please contact team TE09 for access.');
        setIsLoading(false);
        return false;
      }
      
      // Store simple session auth (no timestamps, no expiry complexity)
      sessionStorage.setItem('oneParentAuth', 'authenticated');
      alert('✅ Access granted! You can now use the website.');
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    };

    // Perform login check
    performLogin();
  }, []); // Simple dependency array, no complex state dependencies

  // Show simple loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>Checking access...</p>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `
          }} />
        </div>
      </div>
    );
  }

  // If authenticated, render the app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show access denied
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ color: '#333', margin: '0 0 20px 0', fontSize: '24px' }}>🔐 Access Restricted</h1>
        <p style={{ color: '#666', margin: '0 0 30px 0', lineHeight: 1.5 }}>
          This website is currently under development and requires authentication to access.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '20px',
            fontSize: '14px'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default AuthGuard;