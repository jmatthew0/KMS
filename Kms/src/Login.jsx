import { useState } from 'react';
import './Login.css';
import kmsImage from './assets/kms.png';
import outlookIcon from './assets/outlook.png';
import { Eye, EyeOff } from 'lucide-react';

const Login = ({ onNavigateToRegister, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      // TODO: Replace this with your actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock authentication - Replace with actual API response
      let userRole = 'user';

      if (formData.email === 'admin@example.com' && formData.password === 'admin123') {
        userRole = 'admin';
      } else if (formData.email === 'user@example.com' && formData.password === 'user123') {
        userRole = 'user';
      } else {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userEmail', formData.email);

      onLoginSuccess(userRole);

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

            <div className="form-group-small">
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
              <a href="#" className="forgot-password-link">
                Forgot password?
              </a>
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