import { useState } from 'react'
import Login from './Login'
import Register from './Register'
import Navbar from './Navbar'
import Home from './Home'
import DocumentsPortal from './DocumentsPortal'
import FAQs from './FAQs'
import Profile from './Profile'

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
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
  )
}

export default App