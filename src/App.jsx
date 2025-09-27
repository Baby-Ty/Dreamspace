import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DreamBook from './pages/DreamBook';
import DreamsWeekAhead from './pages/DreamsWeekAhead';
import DreamConnect from './pages/DreamConnect';
import CareerBook from './pages/CareerBook';
import Scorecard from './pages/Scorecard';
import AdminDashboard from './pages/AdminDashboard';
import DreamCoach from './pages/DreamCoach';
import PeopleDashboard from './pages/PeopleDashboard';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('App State:', { isAuthenticated, isLoading, hasUser: !!user });

  if (isLoading) {
    console.log('🔄 App is loading...');
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    console.log('🔐 User not authenticated, showing login');
    return <Login />;
  }

  console.log('✅ User authenticated, showing main app');
  if (!user) {
    console.error('❌ Authenticated but no user data!');
    return <div>Error: User authenticated but no user data available</div>;
  }

  return (
    <AppProvider initialUser={user}>
      <Router basename={import.meta.env.BASE_URL}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dream-book" element={<DreamBook />} />
            <Route path="/dreams-week-ahead" element={<DreamsWeekAhead />} />
            <Route path="/dream-connect" element={<DreamConnect />} />
            <Route path="/career-book" element={<CareerBook />} />
            <Route path="/scorecard" element={<Scorecard />} />
            <Route path="/dream-coach" element={<DreamCoach />} />
            <Route path="/people" element={<PeopleDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;