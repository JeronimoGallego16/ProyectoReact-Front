import axios from "axios";

// Instancia básica temporal
const apiClient = axios.create({
    baseURL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL,
    headers: { "Content-Type": "application/json" }
});

export default apiClient;