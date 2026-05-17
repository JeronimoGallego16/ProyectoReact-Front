import apiService, { ApiResponse } from './api';
import { Criterion } from '../models/Criterion';
import { rubricService } from './RubricService';
import { validatePositiveNumber, validateRequiredText } from '../utils/validation.ts';

const API_URL_CRITERIA = '/evaluation/criteria'

// Clase que gestiona las operaciones relacionadas con los criterios.
class CriterionService {
    // Método para obtener los criterios de una rúbrica específica.
    async getCriteriaByRubricId(rubricId: string): Promise<ApiResponse<Criterion[]>> {
        const response = await apiService.get<Criterion[]>(API_URL_CRITERIA);
        const criteria = Array.isArray(response.data) ? response.data : [];
        return {
            ...response,
            data: criteria.filter(c => c.rubric_id === rubricId),
        };
    }

    // Método para obtener un criterio por su ID.
    async getCriterionById(id: string): Promise<ApiResponse<Criterion>> {
        return apiService.get<Criterion>(`${API_URL_CRITERIA}/${id}`);
    } 

    // Método para crear un criterio para una rúbrica. 
    async createCriterion(criterion: Omit<Criterion, "id">): Promise<ApiResponse<Criterion>> {
        const rubricIdError = validateRequiredText(
            criterion.rubric_id,
            "Se requiere el id de una rúbrica existente para asignar el criterio."
        );
        if (rubricIdError) {
            console.error(rubricIdError);
            return { success: false, error: rubricIdError };
        }

        const nameError = validateRequiredText(criterion.name, 'El nombre del criterio es obligatorio.');
        if (nameError) {
            console.error(nameError);
            return { success: false, error: nameError };
        }

        const weightError = validatePositiveNumber(
            criterion.weight,
            'El peso del criterio es obligatorio y debe ser mayor que 0.'
        );
        if (weightError) {
            console.error(weightError);
            return { success: false, error: weightError };
        }

        const validation = await this.validateCriterionWeight(criterion.rubric_id, Number(criterion.weight) || 0);
        if (!validation.ok) {
            console.error(validation.message);
            return {
                success: false,
                error: validation.message,
            };
        }

        const rubricExists = await rubricService._RubricExists(criterion.rubric_id);
        if (!rubricExists) {
            return {
                success: false,
                error: `No existe la rúbrica con id ${criterion.rubric_id}`,
            };
        }

        return apiService.post<Criterion>(API_URL_CRITERIA, criterion);
    }

    // Método para modificar un criterio existente.
    async updateCriterion(id: string, criterion: Partial<Criterion>): Promise<ApiResponse<Criterion>> {
        if (criterion && Object.prototype.hasOwnProperty.call(criterion, 'name')) {
            const nameError = validateRequiredText(criterion.name, 'El nombre del criterio no puede estar vacío.');
            if (nameError) {
                console.error(nameError);
                return { success: false, error: nameError };
            }
        }

        if (criterion && Object.prototype.hasOwnProperty.call(criterion, 'weight')) {
            const weightError = validatePositiveNumber(criterion.weight, 'El peso del criterio debe ser mayor que 0.');
            if (weightError) {
                console.error(weightError);
                return { success: false, error: weightError };
            }
        }

        return apiService.put<Criterion>(`${API_URL_CRITERIA}/${id}`, criterion);
    }

    // Método para eliminar un criterio.
    async deleteCriterion(id: string): Promise<ApiResponse<any>> {
        const criterionResponse = await this.getCriterionById(id);
        const criterion = criterionResponse.data;
        if (!criterion) {
            console.error(`No existe el criterio con id ${id}`);
            return {
                success: false,
                error: `No existe el criterio con id ${id}`,
            };
        }

        return apiService.delete<any>(`${API_URL_CRITERIA}/${id}`);
    }

    // Valida que el nuevo criterio no haga que la suma de pesos supere 100.
    async validateCriterionWeight(rubricId: string, newWeight: number): Promise<{ ok: boolean; message?: string; total: number; remaining: number; projectedTotal: number }> {
        const rubricCriteriaResponse = await this.getCriteriaByRubricId(rubricId);
        const rubricCriteria = Array.isArray(rubricCriteriaResponse.data) ? rubricCriteriaResponse.data : [];
        const currentTotal = rubricCriteria.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
        const projectedTotal = currentTotal + (Number(newWeight) || 0);
        const remaining = Math.max(0, 100 - currentTotal);

        if (projectedTotal > 100) {
            return {
                ok: false,
                total: currentTotal,
                remaining,
                projectedTotal,
                message: `Los pesos superarían 100. Total actual: ${currentTotal.toFixed(2)}. Te quedan ${remaining.toFixed(2)} puntos disponibles.`,
            };
        }

        return {
            ok: true,
            total: currentTotal,
            remaining,
            projectedTotal,
        };
    }

    // Método que verifica si un criterio existe.
    async _CriterionExists(id: string): Promise<boolean> { 
        const response = await this.getCriterionById(id);
        if (!response.data) {
            console.error(`No existe el criterio con id ${id}`);
            return false;
        }
        return true;
    }
}

export const criterionService = new CriterionService();