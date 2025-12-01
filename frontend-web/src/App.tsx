import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NoAuthRoute from './components/NoAuthRoute';

function App() {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-500">
                <div className="flex flex-col items-center gap-2">
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></span>
                    <span>Ładowanie Whisper...</span>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            {/* KONTENER NA POWIADOMIENIA */}
            <Toaster 
                position="top-center" 
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                    success: {
                        style: { background: '#10B981' },
                    },
                    error: {
                        style: { background: '#EF4444' },
                    },
                }}
            />

            <Routes>
                <Route element={<NoAuthRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<ChatPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;