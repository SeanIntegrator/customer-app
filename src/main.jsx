import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import App from './App';
import Home from './pages/Home';
import Order from './pages/Order';
import OrderPaymentSuccess from './pages/OrderPaymentSuccess';
import OrderPaymentCancelled from './pages/OrderPaymentCancelled';
import Profile from './pages/Profile';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'order', element: <Order /> },
      { path: 'order/success', element: <OrderPaymentSuccess /> },
      { path: 'order/cancelled', element: <OrderPaymentCancelled /> },
      { path: 'profile', element: <Profile /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

function Root() {
  const tree = <RouterProvider router={router} />;
  if (!googleClientId) {
    return tree;
  }
  return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
