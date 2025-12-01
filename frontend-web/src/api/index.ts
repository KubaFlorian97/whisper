import axios from 'axios';

const API_URL = 'http://localhost:8080';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(config => {
    // Pobieramy token, klucze, dane uzytkownika
    const authDataString = localStorage.getItem('whisper_auth');
    
    if (authDataString) {
        try {
            // Parsowanie JSON
            const authData = JSON.parse(authDataString);
            
            // Dodanie tokenu do naglowkow
            if (authData && authData.token) {
                config.headers.Authorization = `Bearer ${authData.token}`;
            }
        } catch (e) {
            console.error("Błąd parsowania danych autoryzacji", e);
            localStorage.removeItem('whisper_auth');
        }
    }
    return config;
});

export default api;