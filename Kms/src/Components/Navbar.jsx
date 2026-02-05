import React, { useState, useRef, useEffect } from "react";
import "../Css/Navbar.css";
import {
  Home,
  FileText,
  HelpCircle,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import IPOPHLLogo from "../assets/IPOPHL logo.png";
import DarkModeToggle from "./DarkModeToggle";
import { useLocation, useNavigate } from "react-router-dom";

import LogoutModal from "./modals/LogoutModal";

export default function Navbar({ onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setShowDropdown(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await onLogout();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          {/* BRAND */}
          <div
            className="navbar-brand"
            onClick={() => navigate("/home")}
            style={{ cursor: "pointer" }}
          >
            <img src={IPOPHLLogo} alt="IPOPHL Logo" className="navbar-logo" />
            <h2 className="brand-title">KMS</h2>
          </div>

          {/* NAV LINKS */}
          <div className="navbar-links">
            <button
              onClick={() => navigate("/home")}
              className={`nav-link ${
                isActive("/home") ? "nav-link-active" : ""
              }`}
            >
              <Home size={18} /> Home
            </button>

            <button
              onClick={() => navigate("/documents")}
              className={`nav-link ${
                isActive("/documents") ? "nav-link-active" : ""
              }`}
            >
              <FileText size={18} /> Documents Portal
            </button>

            <button
              onClick={() => navigate("/faqs")}
              className={`nav-link ${
                isActive("/faqs") ? "nav-link-active" : ""
              }`}
            >
              <HelpCircle size={18} /> FAQs
            </button>
          </div>

          {/* RIGHT SIDE */}
          <div className="navbar-right">
            <DarkModeToggle />

            <div className="profile-dropdown" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <User size={18} />
                <ChevronDown size={16} />
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/profile");
                      setShowDropdown(false);
                    }}
                  >
                    <User size={16} /> View Profile
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item"
                    onClick={handleLogoutClick}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ Separated Logout Modal */}
      <LogoutModal
        open={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
