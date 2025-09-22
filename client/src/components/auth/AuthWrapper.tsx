'use client'

import { useEffect, useState } from 'react'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if already authenticated in this session
    const authStatus = sessionStorage.getItem('oneParentAuth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    // Show authentication modal
    setShowAuthModal(true)
    setIsLoading(false)
  }, [])

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (username === 'teamte09' && password === 'isbest') {
      sessionStorage.setItem('oneParentAuth', 'authenticated')
      setIsAuthenticated(true)
      setShowAuthModal(false)
      setError('')
    } else {
      setError('Invalid credentials. Please try again.')
      setPassword('') // Clear password field
    }
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  if (showAuthModal && !isAuthenticated) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '400px',
          maxWidth: '90%'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '10px',
            color: '#333'
          }}>
            Authentication Required
          </h2>
          <p style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            color: '#666',
            fontSize: '14px'
          }}>
            Please enter your credentials to access this site
          </p>
          
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Username:
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
                autoFocus
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
            
            {error && (
              <div style={{
                color: '#d32f2f',
                textAlign: 'center',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <h2>Access Denied</h2>
      </div>
    )
  }

  return <>{children}</>
}