import { useState } from 'react'
import Login from './Login'
import Register from './Register'
import Navbar from './Navbar'
import Home from './Home'
import DocumentsPortal from './DocumentsPortal'
import FAQs from './FAQs'
import Profile from './Profile'
import Sidebar from './Admin/Sidebar'
import Dashboard from './Admin/Dashboard'
import Analytics from './Admin/Analytics'
import UserManagement from './Admin/UserManagement'

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (role === 'admin') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentPage('login');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
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
        </>
      ) : (
        <>
          {userRole === 'admin' ? (
            <div style={{ display: 'flex' }}>
              <Sidebar 
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {currentPage === 'dashboard' && <Dashboard />}
                {currentPage === 'analytics' && <Analytics />}
                {currentPage === 'users' && <UserManagement />}
              </div>
            </div>
          ) : (
            <>
              <Navbar 
                currentPage={currentPage} 
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
              {currentPage === 'home' && <Home onNavigateToDocuments={() => handleNavigate('documents')} />}
              {currentPage === 'documents' && <DocumentsPortal />}
              {currentPage === 'faqs' && <FAQs />}
              {currentPage === 'profile' && <Profile />}
            </>
          )}
        </>
      )}
    </>
  )
}

export default App