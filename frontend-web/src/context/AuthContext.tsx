import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { AuthResponse } from "../api/apiAuth";

interface WebSocketAuthMessage {
    type: 'AUTH';
    token: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthResponse | null;
    isLoading: boolean;
    webSocket: WebSocket | null;
    login: (data: AuthResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'whisper_auth';
const WEBSOCKET_URL = 'ws://localhost:8080/ws/chat';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

    // localStorage
    useEffect(() => {
        try {
            const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
            if (storedAuth) {
                const data: AuthResponse = JSON.parse(storedAuth);
                setUser(data);
                setToken(data.token);
            }
        } catch (err) {
            console.error("Cannot read auth token", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Zarzadzanie WS
    useEffect(() => {
        if (!token) return;

        console.log("Inicjalizacja WebSocket...");
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log("Connected to WebSocket");
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    const authMessage: WebSocketAuthMessage = {
                        type: 'AUTH',
                        token: token,
                    };
                    ws.send(JSON.stringify(authMessage));
                }
            }, 50);
        };

        ws.onmessage = (event) => {
            console.log("WS message received: ", event.data);
        };

        ws.onclose = (event) => {
            console.log("Disconnected from WebSocket", event.code);
        };

        ws.onerror = (err) => {
            console.error("WS Error: ", err);
            ws.close();
        };

        // Zapis stanu
        setWebSocket(ws);

        return () => {
            console.log("Cleaning up WebSocket...");
            ws.close();
            setWebSocket(null);
        };
    }, [token]);

    const login = (data: AuthResponse) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        setUser(data);
        setToken(data.token);
    };

    const logout = () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
        setToken(null);
    };

    const value: AuthContextType = {
        isAuthenticated: !!user,
        user,
        isLoading,
        webSocket,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be within an AuthProvider");
    }
    return context;
};