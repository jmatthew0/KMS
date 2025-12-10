import React, { useState, useEffect } from "react";
import "./css/Sidebar.css";
import {
  LayoutDashboard,
  BarChart2,
  Users,
  LogOut,
  Menu,
  FileText,
  Clock3
} from "lucide-react";

import IPOPHLLogo from "../assets/IPOPHL logo.png";
import DarkModeToggle from "../Components/DarkModeToggle";

export default function Sidebar({ currentPage, onNavigate, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (
        isOpen &&
        !e.target.closest(".sidebar") &&
        !e.target.closest(".mobile-menu-btn")
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, page: "dashboard" },
    { label: "Analytics", icon: BarChart2, page: "analytics" },
    { label: "User Management", icon: Users, page: "user-management" },
    { label: "Manage FAQs", icon: FileText, page: "manage-faqs" },

    // NEW — Pending Approvals (Admin Only)
    { label: "Pending Approvals", icon: Clock3, page: "pending-approval" },
  ];

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    setIsOpen(false);
    onLogout();
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <button className="mobile-menu-btn" onClick={() => setIsOpen(true)}>
        <Menu size={26} />
      </button>

      {/* Dark overlay */}
      {isOpen && <div className="sidebar-overlay"></div>}

      {/* Sidebar Drawer */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        
        {/* BRAND AREA */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src={IPOPHLLogo} alt="IPOPHL" className="sidebar-logo" />
            <h2 className="sidebar-title">KMS</h2>
          </div>
        </div>

        {/* MENU SECTION */}
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.page}
              className={`sidebar-item ${
                currentPage === item.page ? "active" : ""
              }`}
              onClick={() => {
                onNavigate(item.page);
                setIsOpen(false);
              }}
            >
              <item.icon size={20} className="sidebar-icon" />
              <span>{item.label}</span>
            </button>
          ))}

          <div className="push-down"></div>

          {/* Dark Mode Toggle */}
          <DarkModeToggle />

          {/* Logout */}
          <button className="sidebar-item logout" onClick={handleLogoutClick}>
            <LogOut size={20} className="sidebar-icon" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div
            className="modal-content logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Logout</h2>
              <button
                className="close-button"
                onClick={() => setShowLogoutModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="logout-modal-content">
                <LogOut size={40} className="logout-icon" />
                <p className="logout-modal-title">
                  Are you sure you want to logout?
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="save-button logout-confirm-btn"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
