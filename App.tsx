import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TransactionsPage } from './pages/Transactions';
import { LoansPage } from './pages/Loans';
import { TransfersPage } from './pages/Transfers';
import { AuthPage } from './pages/Auth';
import { OnboardingPage } from './pages/Onboarding';
import { SettingsPage } from './pages/Settings';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  const email = localStorage.getItem('currentUserEmail');
  if (email) {
    const profileData = localStorage.getItem(`profile_${email}`);
    const profile = profileData ? JSON.parse(profileData) : {};
    if (!profile.isProfileComplete) {
      return <Navigate to="/onboarding" replace />;
    }
  } else {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const currentLoginState = localStorage.getItem('isLoggedIn') === 'true';
      setIsAuthenticated(currentLoginState);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsAuthenticated(true);
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUserEmail');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <AuthPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/onboarding" 
          element={
            isAuthenticated ? <OnboardingPage /> : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout onLogout={handleLogout}><Dashboard /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/income" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout onLogout={handleLogout}><TransactionsPage type="INCOME" /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/expense" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout onLogout={handleLogout}><TransactionsPage type="EXPENSE" /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/transfers" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout onLogout={handleLogout}><TransfersPage /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/loans" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout onLogout={handleLogout}><LoansPage /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout onLogout={handleLogout}><SettingsPage /></Layout>
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
};

export default App;