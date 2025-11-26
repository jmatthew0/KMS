import React, { useState } from 'react';
import './Login.css';
import kmsImage from './assets/kms.png';
import outlookImage from './assets/outlook.png';
import { Eye, EyeOff } from 'lucide-react';

export default function Login({ onNavigateToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    console.log('Login attempt:', { email, password });
    // After successful login validation, navigate to documents portal
    onLoginSuccess();
  };

  const handleOutlookLogin = () => {
    console.log('Outlook login clicked');
    // After successful Outlook login, navigate to documents portal
    onLoginSuccess();
  };

  return (
    <div className="login-container">
     
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Welcome back! please enter your details</p>

          <div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            
            <div className="form-group-small">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            
            <div className="forgot-password-wrapper">
              <a href="#" className="forgot-password-link">
                Forgot Password
              </a>
            </div>

            
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
            >
              Sign in
            </button>

            
            <button
              onClick={handleOutlookLogin}
              className="btn btn-secondary"
            >
              <img src={outlookImage} alt="Outlook" className="outlook-icon" />
              Sign in with Outlook
            </button>

            
            <div className="register-section">
              <span className="register-text">Don't have an account? </span>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToRegister(); }} className="register-link">
                Register
              </a>
            </div>
          </div>
        </div>
      </div>

      
      <div className="login-image-section">
        <img 
          src={kmsImage} 
          alt="Login illustration" 
          className="login-image"
        />
      </div>
    </div>
  );
}