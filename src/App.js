import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import NewForm from './pages/NewForm';
import FormsList from './pages/FormsList';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Layout
import Layout from './components/layout/Layout';

// Styles
import './styles/globals.css';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="new-form" element={<NewForm />} />
              <Route path="forms" element={<FormsList />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;