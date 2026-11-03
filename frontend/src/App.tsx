import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/auth-context';
import LoginPage from './pages/login-page';
import PreviewPage from './pages/preview-page';

const toastOptions = {
    success: {
        duration: 5000,
        style: {
          background: '#ffffff',
          color: '#30f94b'
        },
        iconTheme: {
          primary: '#365613',
          secondary: '#30f94b'
        }
      },
      error: {
        duration: 5000,
        style: {
          background: '#ffff',
          color: '#cb1010'
        },
        iconTheme: {
          primary: '#365613',
          secondary: '#cb1010'
        }
    }
}

function PublicRoute() {
    const { isAuthenticated } = useAuth();

    return isAuthenticated ? <Navigate to="/library" replace /> : <LoginPage />;
}

function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <main className="grid min-h-screen place-items-center bg-stone-50 text-sm text-stone-500">
                Checking your session…
            </main>
        );
    }

    return isAuthenticated ? <PreviewPage /> : <Navigate to="/" replace />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<PublicRoute />} />
            <Route path="/library" element={<ProtectedRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="bottom-center" toastOptions={ toastOptions } />
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
