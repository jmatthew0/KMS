import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { loginUser, getUserProfile } from '../api/authService';
import '../Css/Login.css';
import kmsImage from '../assets/kms.png';
import outlookIcon from '../assets/outlook.png';
import googleIcon from '../assets/googleLogo.png';

const Login = ({ onNavigateToRegister, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        console.error("Google login error:", error);
        setError("Failed to sign in with Google.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Google login failed.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await loginUser(
        formData.email, 
        formData.password
      );

      if (authError) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      let profileData = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts && !profileData) {
        const { data, error: profileError } = await getUserProfile(authData.user.id);
        
        if (data) {
          profileData = data;
          break;
        }

        if (profileError && attempts < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        } else if (profileError) {
          profileData = {
            role: 'user',
            full_name: authData.user.email
          };
          break;
        }
      }

      localStorage.setItem('userRole', profileData.role || 'user');
      localStorage.setItem('userEmail', authData.user.email);
      localStorage.setItem('userId', authData.user.id);
      localStorage.setItem('userName', profileData.full_name || authData.user.email);

      onLoginSuccess(profileData.role || 'user');

    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOutlookLogin = () => {
    alert('Outlook login coming soon!');
  };

  // ============================
  // FORGOT PASSWORD FUNCTION
  // ============================
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);

    try {
      if (!resetEmail) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resetEmail)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        setError('Failed to send reset email. Please try again.');
      } else {
        setResetSuccess('Password reset email sent! Please check your inbox.');
        setResetEmail('');
        
        // Auto close after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetSuccess('');
        }, 3000);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setError('');
    setResetSuccess('');
  };

  // ============================
  // FORGOT PASSWORD VIEW
  // ============================
  if (showForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-form-section">
          <div className="login-form-wrapper">
            <button
              onClick={handleBackToLogin}
              className="back-button"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                marginBottom: '1rem',
                padding: '0.5rem 0',
                fontSize: '0.875rem'
              }}
            >
              <ArrowLeft size={16} />
              Back to login
            </button>

            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">
              Enter your email address and we'll send you a link to reset your password
            </p>

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

            {resetSuccess && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {resetSuccess}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">
                  Email
                </label>
                <input
                  id="reset-email"
                  name="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>

        <div className="login-image-section">
          <img src={kmsImage} alt="KMS illustration" className="login-image" />
        </div>
      </div>
    );
  }

  // ============================
  // MAIN LOGIN VIEW
  // ============================
  return (
    <div className="login-container">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Please enter your details to sign in</p>

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

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle-btn"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="forgot-password-wrapper">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="forgot-password-link"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleOutlookLogin}
              disabled={loading}
            >
              <img src={outlookIcon} alt="Outlook" className="outlook-icon" />
              Sign in with Outlook
            </button>

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
              Sign in with Google
            </button>
          </form>

          <div className="register-section">
            <span className="register-text">Don't have an account? </span>
            <button 
              onClick={onNavigateToRegister}
              className="register-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              disabled={loading}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      <div className="login-image-section">
        <img src={kmsImage} alt="KMS illustration" className="login-image" />
      </div>
    </div>
  );
};

export default Login;