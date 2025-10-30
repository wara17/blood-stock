import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layouts/Layout';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import BloodInventoryDashboard from './components/BloodInventoryDashboard';
import BloodReservationList from './components/BloodReservationList';
import BloodReservationForm from './components/BloodReservationForm';
import BloodDispensePage from './components/BloodDispensePage';
import PendingDispenseList from './components/PendingDispenseList';
import 'bootstrap/dist/css/bootstrap.min.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login with current location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect to current page or dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // If authenticated, redirect to the intended page or dashboard
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blood-inventory" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <BloodInventoryDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blood-reservation-list" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <BloodReservationList />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blood-reservation-form" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <BloodReservationForm />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blood-dispense/:reservationId" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <BloodDispensePage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pending-dispense" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <PendingDispenseList />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;