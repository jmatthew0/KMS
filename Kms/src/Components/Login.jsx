import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import "../Css/Login.css";
import kmsImage from "../assets/kms.png";
import outlookIcon from "../assets/outlook.png";
import googleIcon from "../assets/googleLogo.png";

const Login = ({ onNavigateToRegister, onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const togglePasswordVisibility = () => setShowPassword((s) => !s);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // ✅ better than /login (lets App route based on session/role)
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) setError(error.message || "Failed to sign in with Google.");
    } catch (err) {
      console.error(err);
      setError("Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Manual login (Email + Password) using Supabase directly
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const email = formData.email.trim();

      if (!email || !formData.password) {
        setError("Please fill in all fields");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error || !data?.session) {
        const msg = error?.message?.toLowerCase?.() || "";

        // ✅ Helpful hint for Google-only accounts or wrong password
        if (msg.includes("invalid login credentials")) {
          setError(
            "Invalid email or password. If you usually sign in with Google, click 'Forgot password?' to set a password first."
          );
        } else if (msg.includes("email not confirmed")) {
          setError("Your email is not confirmed yet. Please check your inbox for the confirmation email.");
        } else {
          setError(error?.message || "Login failed. Please try again.");
        }
        return;
      }

      // ✅ Let your App/Auth listener take over, but force reroute reliably
      onLoginSuccess?.();
      window.location.replace("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOutlookLogin = () => alert("Outlook login coming soon!");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setResetSuccess("");
    setLoading(true);

    try {
      if (!resetEmail) {
        setError("Please enter your email address");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resetEmail)) {
        setError("Please enter a valid email address");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Password reset error:", error);
        setError(error.message || "Failed to send reset email. Please try again.");
      } else {
        setResetSuccess("Password reset email sent! Please check your inbox.");
        setResetEmail("");

        setTimeout(() => {
          setShowForgotPassword(false);
          setResetSuccess("");
        }, 3000);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setError("");
    setResetSuccess("");
  };

  // Forgot password view
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
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "none",
                border: "none",
                color: "#2563eb",
                cursor: "pointer",
                marginBottom: "1rem",
                padding: "0.5rem 0",
                fontSize: "0.875rem",
              }}
            >
              Back to login
            </button>

            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>

            {error && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            {resetSuccess && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#d1fae5",
                  color: "#065f46",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                }}
              >
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
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
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

  // Main login view
  return (
    <div className="login-container">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Please enter your details to sign in</p>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                fontSize: "0.875rem",
              }}
            >
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
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button type="button" className="btn btn-secondary" onClick={handleOutlookLogin} disabled={loading}>
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
              <img src={googleIcon} alt="Google" className="outlook-icon" style={{ marginRight: "8px" }} />
              Sign in with Google
            </button>
          </form>

          <div className="register-section">
            <span className="register-text">Don&apos;t have an account? </span>
            <button
              onClick={onNavigateToRegister}
              className="register-link"
              style={{ background: "none", border: "none", cursor: "pointer" }}
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
