import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Eager imports (needed immediately)
import Layout from './components/Layout';
import Login from './pages/Login';

// Lazy-loaded page routes with named chunks for better debugging
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'));
const DreamBook = lazy(() => import(/* webpackChunkName: "dream-book" */ './pages/DreamBook'));
const DreamsWeekAhead = lazy(() => import(/* webpackChunkName: "dreams-week-ahead" */ './pages/DreamsWeekAhead'));
const DreamConnect = lazy(() => import(/* webpackChunkName: "dream-connect" */ './pages/dream-connect/DreamConnectLayout'));
const CareerBook = lazy(() => import(/* webpackChunkName: "career-book" */ './pages/career/CareerBookLayout'));
const Scorecard = lazy(() => import(/* webpackChunkName: "scorecard" */ './pages/Scorecard'));
const AdminDashboard = lazy(() => import(/* webpackChunkName: "admin-dashboard" */ './pages/AdminDashboard'));
const DreamCoach = lazy(() => import(/* webpackChunkName: "dream-coach" */ './pages/DreamCoach'));
const PeopleDashboard = lazy(() => import(/* webpackChunkName: "people-dashboard" */ './pages/people/PeopleDashboardLayout'));
const HealthCheck = lazy(() => import(/* webpackChunkName: "health-check" */ './pages/HealthCheck'));
const VisionBuilderDemo = lazy(() => import(/* webpackChunkName: "vision-builder-demo" */ './pages/VisionBuilderDemo'));
const AdaptiveCardsLab = lazy(() => import(/* webpackChunkName: "adaptive-cards-lab" */ './pages/labs/AdaptiveCards'));

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
          <Suspense fallback={<LoadingSpinner />}>
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
              <Route path="/health" element={<HealthCheck />} />
              <Route path="/vision-builder-demo" element={<VisionBuilderDemo />} />
              <Route path="/labs/adaptive-cards" element={<AdaptiveCardsLab />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AppProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;