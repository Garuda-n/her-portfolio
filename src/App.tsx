import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PortfolioView } from './views/PortfolioView';
import { AdminView } from './views/AdminView';
import { LoginView } from './views/LoginView';
import { VideoProvider } from './context/VideoContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash === '#/admin' ? 'admin' : 'portfolio');
  const { user, loading } = useAuthContext();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash === '#/admin' ? 'admin' : 'portfolio');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (currentRoute === 'admin') {
    if (loading) {
      return (
        <div className="auth-loading-screen">
          <div className="auth-spinner"></div>
          <span>Loading Session...</span>
        </div>
      );
    }
    
    if (!user) {
      return <LoginView />;
    }
    
    return <AdminView />;
  }

  return (
    <>
      <Navbar />
      <main className="main-content-layout">
        <PortfolioView />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <VideoProvider>
        <AppContent />
      </VideoProvider>
    </AuthProvider>
  );
}

export default App;


