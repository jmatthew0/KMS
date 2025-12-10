import { useState, useEffect } from 'react';

import Login from './Components/Login';
import Register from './Components/Register';
import ResetPassword from './Components/ResetPassword';
import Navbar from './Components/Navbar';
import Home from './Components/Home';
import DocumentsPortal from './Components/DocumentsPortal';
import FAQs from './Components/FAQs';
import Profile from './Components/Profile';

// Admin pages
import Sidebar from './Admin/Sidebar';
import Dashboard from './Admin/Dashboard';
import Analytics from './Admin/Analytics';
import UserManagement from './Admin/UserManagement';
import ManageFAQs from './Admin/ManageFaqs';
import PendingApproval from './Admin/PendingApproval';   // ✅ ADDED

import { supabase } from './lib/supabaseClient';
import { DarkModeProvider } from './context/DarkModeContext.jsx';
import './Css/DarkMode.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add('preload');
    setTimeout(() => document.body.classList.remove('preload'), 100);

    const hash = window.location.hash;

    if (hash && hash.includes('type=recovery')) {
      setCurrentPage('reset-password');
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const storedRole = localStorage.getItem('userRole');

      if (session?.user) {
        const user = session.user;

        localStorage.setItem('userId', user.id);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.user_metadata?.full_name || user.email);

        const role = storedRole || 'user';
        localStorage.setItem('userRole', role);

        setIsAuthenticated(true);
        setUserRole(role);
        setCurrentPage(role === 'admin' ? 'dashboard' : 'home');
      } else {
        setIsAuthenticated(false);
        setCurrentPage('login');
      }

    } catch (err) {
      console.error('Error checking auth:', err);
      setIsAuthenticated(false);
      setCurrentPage('login');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (role) => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        localStorage.setItem('userId', session.user.id);
        localStorage.setItem('userEmail', session.user.email);
        localStorage.setItem('userName', session.user.user_metadata?.full_name || session.user.email);
      }
    });

    localStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUserRole(role);

    setCurrentPage(role === 'admin' ? 'dashboard' : 'home');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentPage('login');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DarkModeProvider>
      {!isAuthenticated ? (
        <>
          {currentPage === 'login' && (
            <Login 
              onNavigateToRegister={() => setCurrentPage('register')} 
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {currentPage === 'register' && (
            <Register onNavigateToLogin={() => setCurrentPage('login')} />
          )}

          {currentPage === 'reset-password' && (
            <ResetPassword onNavigateToLogin={() => setCurrentPage('login')} />
          )}
        </>
      ) : (
        <>
          {userRole === 'admin' ? (
            <div style={{ display: 'flex' }}>
              {/* Sidebar */}
              <Sidebar
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />

              {/* Admin Content */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {currentPage === 'dashboard' && <Dashboard />}
                {currentPage === 'analytics' && <Analytics />}
                {currentPage === 'user-management' && <UserManagement />}
                {currentPage === 'manage-faqs' && <ManageFAQs />}
                {currentPage === 'pending-approval' && <PendingApproval />} {/* ✅ NEW */}
              </div>
            </div>
          ) : (
            <>
              {/* User Navbar */}
              <Navbar
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />

              {/* User Content */}
              {currentPage === 'home' && (
                <Home onNavigateToDocuments={() => handleNavigate('documents')} />
              )}
              {currentPage === 'documents' && <DocumentsPortal />}
              {currentPage === 'faqs' && <FAQs />}
              {currentPage === 'profile' && <Profile />}
            </>
          )}
        </>
      )}
    </DarkModeProvider>
  );
}

export default App;
