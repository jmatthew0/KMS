import React, { useState, useEffect } from "react";
import "./css/Sidebar.css";
import {
  LayoutDashboard,
  BarChart2,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar({ currentPage, onNavigate, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

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
  ];

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

        
        <div className="sidebar-header">
          <h2 className="sidebar-title">KMS</h2>
        </div>

        <nav className="sidebar-menu">

          {/* Menu Items */}
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

          {/* Spacer (pushes logout down) */}
          <div className="push-down"></div>

          {/* Logout Button */}
          <button
            className="sidebar-item logout"
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
          >
            <LogOut size={20} className="sidebar-icon" />
            <span>Logout</span>
          </button>

        </nav>
      </div>
    </>
  );
}
