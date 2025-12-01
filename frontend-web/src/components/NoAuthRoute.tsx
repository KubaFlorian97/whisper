import type React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";


const NoAuthRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <div>Ładowanie danych...</div>;

    return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export default NoAuthRoute;