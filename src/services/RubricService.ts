import apiService, { ApiResponse } from './api';
import { Rubric } from '../models/Rubric';
import { criterionService } from './CriterionService';
import { scaleService } from './ScaleService';

const API_URL_RUBRICS = '/evaluation/rubrics'

// Clase que gestiona las operaciones relacionadas con las rúbricas.
class RubricService {
    // Método para obtener una lista de rúbricas.
    async getRubrics(): Promise<ApiResponse<Rubric[]>> {
        return apiService.get<Rubric[]>(API_URL_RUBRICS);
    }

    // Método para obtener una rúbrica por su ID.
    async getRubricById(id: string): Promise<ApiResponse<Rubric>> {
        return apiService.get<Rubric>(`${API_URL_RUBRICS}/${id}`);
    } 

    // Método para crear una nueva rúbrica.
    async createRubric(rubric: Omit<Rubric, "id">): Promise<ApiResponse<Rubric>> {
        return apiService.post<Rubric>(API_URL_RUBRICS, rubric);
    }

    // Método para modificar una rúbrica existente.
    async updateRubric(id: string, rubric: Partial<Rubric>): Promise<ApiResponse<Rubric>> {
        return apiService.put<Rubric>(`${API_URL_RUBRICS}/${id}`, rubric);
    }

    // Método para publicar una rúbrica.
    async publishRubric(id: string): Promise<ApiResponse<Rubric>> {
        const rubricResponse = await this.getRubricById(id);
        const rubric = rubricResponse.data;
        if (!rubric) {
            return {
                success: false,
                error: rubricResponse.error || `No existe la rúbrica con id ${id}`,
            };
        }

        if (rubric.is_public) {
            console.warn(`La rúbrica ${id} ya está publicada.`);
            return rubricResponse;
        }

        const rubricCriteriaResponse = await criterionService.getCriteriaByRubricId(id);
        const rubricCriteria = Array.isArray(rubricCriteriaResponse.data) ? rubricCriteriaResponse.data : [];
        if (rubricCriteria.length < 2) {
            console.error(`No se puede publicar la rúbrica ${id}: requiere mínimo 2 criterios y solo tiene ${rubricCriteria.length}`);
            return {
                success: false,
                error: `No se puede publicar la rúbrica ${id}: requiere mínimo 2 criterios y solo tiene ${rubricCriteria.length}`,
            };
        }

        const criteriaScales = await Promise.all(rubricCriteria.map((c: any) => scaleService.getScaleByCriterionId(c.id)));
        if (criteriaScales.some(scalesResponse => (Array.isArray(scalesResponse.data) ? scalesResponse.data : []).length < 2)) {
            console.error(`No se puede publicar la rúbrica ${id}: cada criterio requiere mínimo 2 escalas`);
            return {
                success: false,
                error: `No se puede publicar la rúbrica ${id}: cada criterio requiere mínimo 2 escalas`,
            };
        }

        const response = await apiService.patch<Rubric>(`${API_URL_RUBRICS}/${id}/publish`, { is_public: true, is_archived: false });
        if (response.error) {
            console.error('Error:', response.error);
            return response;
        }

        const updatedRubricResponse = await this.updateRubric(id, { is_public: true, is_archived: false });
        return updatedRubricResponse.data ? updatedRubricResponse : response;
    }

    // Método para eliminar una rúbrica.
    async deleteRubric(id: string): Promise<ApiResponse<any>> {
        const rubricResponse = await this.getRubricById(id);
        const rubric = rubricResponse.data;
        if (!rubric || rubric.is_public) {
            console.error(`No se puede eliminar porque la rúbrica está publicada. Debes archivarla.`);
            return {
                success: false,
                error: `No se puede eliminar porque la rúbrica está publicada. Debes archivarla.`,
            };
        }

        return apiService.delete<any>(`${API_URL_RUBRICS}/${id}`);
    }

    // Método para archivar una rúbrica.
    async archiveRubric(id: string): Promise<ApiResponse<Rubric>> {
        const rubricResponse = await this.getRubricById(id);
        const rubric = rubricResponse.data;
        if (!rubric || rubric.is_archived) {
            console.error(`La rúbrica ya está archivada.`);
            return {
                success: false,
                error: `La rúbrica ya está archivada.`,
            };
        }

        return this.updateRubric(id, { is_archived: true, is_public: false });
    }

    // Método que verifica si una rúbrica existe.
    async _RubricExists(id: string): Promise<boolean> { 
        const response = await this.getRubricById(id);
        if (!response.data) {
            console.error(`No existe la rúbrica con id ${id}`);
            return false;
        }
        return true;
    }
}

export const rubricService = new RubricService();