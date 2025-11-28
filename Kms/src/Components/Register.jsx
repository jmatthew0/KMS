import React, { useState } from 'react';
import "../Css/Register.css";

import kmsImage from '../assets/kms.png';
import outlookImage from '../assets/outlook.png';
import { Eye, EyeOff } from 'lucide-react';

export default function Register({ onNavigateToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Register attempt:', { name, email, password });
  };

  const handleOutlookRegister = () => {
    console.log('Outlook register clicked');
  };

  return (
    <div className="register-container">
      
      <div className="register-form-section">
        <div className="register-form-wrapper">
          <h1 className="register-title">Hello!</h1>
          <p className="register-subtitle">Let's Register Your Account</p>

          <div>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

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

            
            <div className="form-group">
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

            
            <div className="form-group-small">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle-btn"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
              Register
            </button>

            
            <button
              onClick={handleOutlookRegister}
              className="btn btn-secondary"
            >
              <img src={outlookImage} alt="Outlook" className="outlook-icon" />
              Sign in with Outlook
            </button>

            
            <div className="signin-section">
              <span className="signin-text">Already have an account? </span>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} className="signin-link">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>

      
      <div className="register-image-section">
        <img 
          src={kmsImage} 
          alt="Register illustration" 
          className="register-image"
        />
      </div>
    </div>
  );
}