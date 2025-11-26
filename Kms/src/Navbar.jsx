import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import { Home, FileText, HelpCircle, LogOut, User, ChevronDown } from 'lucide-react';

export default function Navbar({ currentPage, onNavigate, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <h2 className="brand-title">KMS</h2>
        </div>
        
        <div className="navbar-links">
          <button
            onClick={() => onNavigate('home')}
            className={`nav-link ${currentPage === 'home' ? 'nav-link-active' : ''}`}
          >
            <Home size={18} />
            Home
          </button>
          
          <button
            onClick={() => onNavigate('documents')}
            className={`nav-link ${currentPage === 'documents' ? 'nav-link-active' : ''}`}
          >
            <FileText size={18} />
            Documents Portal
          </button>
          
          <button
            onClick={() => onNavigate('faqs')}
            className={`nav-link ${currentPage === 'faqs' ? 'nav-link-active' : ''}`}
          >
            <HelpCircle size={18} />
            FAQs
          </button>
        </div>

        <div className="navbar-right">
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
                    onNavigate('profile');
                    setShowDropdown(false);
                  }}
                >
                  <User size={16} />
                  View Profile
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={onLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}