import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DreamBook from './pages/DreamBook';
import DreamsWeekAhead from './pages/DreamsWeekAhead';
import DreamConnect from './pages/DreamConnect';
import CareerBook from './pages/CareerBook';
import Scorecard from './pages/Scorecard';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { isAuthenticated, login } = useApp();

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dream-book" element={<DreamBook />} />
          <Route path="/dreams-week-ahead" element={<DreamsWeekAhead />} />
          <Route path="/dream-connect" element={<DreamConnect />} />
          <Route path="/career-book" element={<CareerBook />} />
          <Route path="/scorecard" element={<Scorecard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;