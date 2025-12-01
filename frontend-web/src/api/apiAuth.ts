import api from "./index";

interface RegisterRequest {
    displayName: string;
    email?: string;
    phoneNumber?: string;
    password: string;
}

interface LoginRequest {
    loginIdentifier: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    userId: number;
    displayName: string;
}

// Rejestracja uzytkownika
export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
        const response = await api.post<AuthResponse>('/api/auth/register', data);
        return response.data;
    } catch (error) {
        console.error("Registration error: ", error);
        throw error;
    }
};

// Logowanie uzytkownika
export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
    try {
        const response = await api.post<AuthResponse>('/api/auth/login', data);
        return response.data;
    } catch (error) {
        console.error("Login error: ", error);
        throw error;
    }
};