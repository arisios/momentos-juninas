import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage   from './pages/AuthPage';
import Home       from './pages/Home';
import AlbumMap   from './pages/AlbumMap';
import AdminPanel from './pages/AdminPanel';
import LoadingSpinner from './components/LoadingSpinner';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-junina flex items-center justify-center"><LoadingSpinner size="lg" text="Carregando..." /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/"      element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/album/:id" element={<PrivateRoute><AlbumMap /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
          <Route path="*"      element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: { fontFamily: 'DM Sans, sans-serif', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 4px 20px rgba(180,83,9,0.15)' },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
