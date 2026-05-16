import React, { useState } from 'react';
import loginBg from '../assets/login-bg.jpg'; // Importing your epic character art!

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        // Successful login, pass data up to App.js
        onLogin(data.token, data.user);
      } else {
        // Successful registration, switch to login mode
        alert('Account created! You can now log in.');
        setIsLogin(true);
        setPassword(''); // clear password for safety
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    // OUTER FULL-SCREEN WRAPPER
    <div style={{ 
        backgroundImage: `url(${loginBg})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        minHeight: '100vh', 
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box'
    }}>
      
      {/* THE GLASSMORPHISM LOGIN CARD */}
      <div style={{ 
          width: '100%',
          maxWidth: '400px', 
          padding: '40px', 
          background: 'rgba(15, 23, 42, 0.85)', /* Dark frosted glass */
          backdropFilter: 'blur(12px)', 
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', /* Subtle glow edge */
          borderRadius: '12px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', /* Deep shadow */
          color: 'white' /* Makes all text white */
      }}>
        
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#f8fafc', letterSpacing: '1px' }}>
          {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
        </h2>
        
        {error && <p style={{ color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.5)' }}>{error}</p>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  background: 'rgba(0, 0, 0, 0.4)', /* Dark input background */
                  color: 'white', 
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontSize: '15px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid rgba(255, 255, 255, 0.2)', 
                  background: 'rgba(0, 0, 0, 0.4)', 
                  color: 'white', 
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontSize: '15px'
              }}
            />
          </div>

          <button 
            type="submit" 
            style={{ 
                padding: '14px', 
                background: 'rgba(239, 68, 68, 0.9)', /* Deep Gaming Red */
                color: 'white', 
                border: '1px solid #ef4444', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '16px',
                letterSpacing: '1px',
                marginTop: '10px',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(220, 38, 38, 1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.9)'}
          >
            {isLogin ? 'Sign In' : 'Join the Fight'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px', color: '#94a3b8' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ 
                background: 'none', 
                border: 'none', 
                color: '#ef4444', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                textDecoration: 'none',
                padding: 0
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;