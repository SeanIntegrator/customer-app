import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AppConfigProvider } from './context/AppConfigContext';
import { LoyaltyProvider } from './context/LoyaltyContext';
import { CartProvider } from './context/CartContext';
import { OrderEventsProvider } from './context/OrderEventsContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import Home from './pages/Home';
import OrderShell from './pages/OrderShell';
import OrderHub from './pages/OrderHub';
import OrderMenu from './pages/OrderMenu';
import OrderPaymentSuccess from './pages/OrderPaymentSuccess';
import OrderPaymentCancelled from './pages/OrderPaymentCancelled';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <AppConfigProvider>
          <LoyaltyProvider>
            <CartProvider>
              <OrderEventsProvider>
                <App />
              </OrderEventsProvider>
            </CartProvider>
          </LoyaltyProvider>
        </AppConfigProvider>
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'order/success', element: <OrderPaymentSuccess /> },
      { path: 'order/cancelled', element: <OrderPaymentCancelled /> },
      {
        path: 'order',
        element: <OrderShell />,
        children: [
          { index: true, element: <OrderHub /> },
          { path: 'menu/:categorySlug', element: <OrderMenu /> },
        ],
      },
      { path: 'profile', element: <Profile /> },
      { path: 'rewards', element: <Rewards /> },
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
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
);
