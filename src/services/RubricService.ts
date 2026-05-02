import apiClient from '../interceptor/apiClient';
import { Rubric } from '../models/Rubric';

const API_URL = '/evaluation/rubrics'

// Clase que gestiona las operaciones relacionadas con las rúbricas.

class RubricService {
    // Método para obtener una lista de rúbricas.
    async getRubrics(): Promise<Rubric[]> {
        try {
            console.log("Petición enviada a:", import.meta.env.VITE_API_URL + API_URL);
            const response = await apiClient.get(API_URL);
            console.log("Respuesta del servidor:", response.status, response.data);
            const payload = response.data;
            // Backend wraps responses as { message, data } — normalize to return an array
            const result = payload && payload.data !== undefined ? payload.data : payload;
            if (Array.isArray(result)) return result as Rubric[];
            return [];
        } catch (error: any) {
            if (error.response) {
                console.error("Servidor respondió con error:", error.response.status);
            } else if (error.request) {
            console.error("No se recibió respuesta (¿Back apagado?):", error.request);
            }
            return [];
        }
    }

    // Método para crear una nueva rúbrica.
    async createRubric(rubric: Omit<Rubric, "id">): Promise<Rubric | null> {
        try {
            const response = await apiClient.post<Rubric>(API_URL, rubric);
            return response.data;
        } catch (error) {
            console.error("Error al crear la rúbrica:", error);
            return null;
        }
    }

}

export const rubricService = new RubricService();