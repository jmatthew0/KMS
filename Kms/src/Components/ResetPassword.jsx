import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import "../Css/Login.css";
import kmsImage from "../assets/kms.png";

const ResetPassword = ({ onNavigateToLogin }) => {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ Confirm token is present (very important)
      const hash = window.location.hash || "";
      console.log("RESET HASH:", hash);

      if (!hash.includes("type=recovery") && !hash.includes("access_token=")) {
        throw new Error(
          "Reset link is missing/expired. Please go back to Login and request a new reset link."
        );
      }

      if (!formData.newPassword || !formData.confirmPassword) {
        throw new Error("Please fill in all fields");
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (formData.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // ✅ Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        console.error("updateUser error:", updateError);
        throw new Error(updateError.message || "Failed to update password.");
      }

      alert("Password updated successfully! Please login with your new password.");

      // ✅ clear hash ONLY AFTER success
      window.history.replaceState(null, "", window.location.pathname);

      onNavigateToLogin();
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h1 className="login-title">Reset Your Password</h1>
          <p className="login-subtitle">Enter your new password below</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="password-toggle-btn"
                  disabled={loading}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle-btn"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="btn btn-secondary back-to-login-btn"
              disabled={loading}
            >
              Back to login
            </button>
          </form>
        </div>
      </div>

      <div className="login-image-section">
        <img src={kmsImage} alt="KMS illustration" className="login-image" />
      </div>
    </div>
  );
};

export default ResetPassword;
