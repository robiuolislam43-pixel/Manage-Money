import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TransactionsPage } from './pages/Transactions';
import { LoansPage } from './pages/Loans';
import { TransfersPage } from './pages/Transfers';
import { AnalyticsPage } from './pages/Analytics';
import { AuthPage } from './pages/Auth';
import { OnboardingPage } from './pages/Onboarding';
import { SettingsPage } from './pages/Settings';
import { supabase } from './services/supabase';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        localStorage.setItem('currentUserEmail', session.user.email!);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentUserEmail');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage onLogin={handleLogin} />} />
        <Route path="/onboarding" element={isAuthenticated ? <OnboardingPage /> : <Navigate to="/login" replace />} />

        <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout onLogout={handleLogout}><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/income" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout onLogout={handleLogout}><TransactionsPage type="INCOME" /></Layout></ProtectedRoute>} />
        <Route path="/expense" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout onLogout={handleLogout}><TransactionsPage type="EXPENSE" /></Layout></ProtectedRoute>} />
        <Route path="/transfers" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout onLogout={handleLogout}><TransfersPage /></Layout></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout onLogout={handleLogout}><LoansPage /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout onLogout={handleLogout}><AnalyticsPage /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout onLogout={handleLogout}><SettingsPage /></Layout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
};

export default App;