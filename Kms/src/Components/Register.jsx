import React, { useState } from 'react';
import "../Css/Register.css";
import kmsImage from '../assets/kms.png';
import outlookIcon from '../assets/outlook.png';
import googleIcon from '../assets/googleLogo.png';
import { Eye, EyeOff } from 'lucide-react';
import { registerUser } from '../api/authService';
import { supabase } from '../lib/supabaseClient';

export default function Register({ onNavigateToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('one special character');
    }
    
    return errors;
  };

  // ============================
  // GOOGLE LOGIN REGISTER
  // ============================
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });

      if (error) {
        console.error("Google login error:", error);
        setError("Failed to sign up with Google.");
        setLoading(false);
      }

    } catch (err) {
      console.error(err);
      setError("Google login failed.");
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password must contain ${passwordErrors.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      const { error: registerError } = await registerUser(email, password, name);

      if (registerError) {
        if (registerError.message.includes('already registered')) {
          setError('This email is already registered. Please login instead.');
        } else {
          setError(registerError.message || 'Registration failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      setSuccess('Registration successful! Please check your email to verify your account.');

      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        onNavigateToLogin();
      }, 3000);

    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOutlookRegister = () => {
    alert('Outlook registration coming soon!');
  };

  return (
    <div className="register-container">
      
      <div className="register-form-section">
        <div className="register-form-wrapper">
          <h1 className="register-title">Hello!</h1>
          <p className="register-subtitle">Let's Register Your Account</p>

          {/* ERROR MESSAGE */}
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {success}
            </div>
          )}

          <div>

            {/* NAME */}
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* EMAIL */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* PASSWORD */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
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

            {/* CONFIRM PASSWORD */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
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

            {/* MAIN REGISTER BUTTON */}
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>

            {/* OUTLOOK BUTTON FIRST (matches Login.jsx) */}
            <button
              className="btn btn-secondary"
              onClick={handleOutlookRegister}
              disabled={loading}
              style={{ marginTop: "10px", marginBottom: "10px" }}
            >
              <img src={outlookIcon} alt="Outlook" className="outlook-icon" />
              Sign up with Outlook
            </button>

            {/* GOOGLE BUTTON BELOW (matches Login.jsx) */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ marginTop: "10px" }}
            >
              <img 
                src={googleIcon} 
                alt="Google" 
                className="outlook-icon"
                style={{ marginRight: "8px" }} 
              />
              Sign up with Google
            </button>

            {/* SIGN IN LINK */}
            <div className="signin-section">
              <span className="signin-text">Already have an account? </span>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} 
                className="signin-link"
              >
                Sign In
              </a>
            </div>

          </div>

        </div>
      </div>

      {/* IMAGE SECTION */}
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