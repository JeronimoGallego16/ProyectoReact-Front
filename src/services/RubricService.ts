import apiService, { ApiResponse } from './api';
import { Rubric } from '../models/Rubric';
import { Criterion } from '../models/Criterion';
import { Scale } from '../models/Scale';

const API_URL_RUBRICS = '/evaluation/rubrics'
const API_URL_CRITERIA = '/evaluation/criteria'
const API_URL_SCALES = '/evaluation/scales'


// Clase que gestiona las operaciones relacionadas con las rúbricas.
class RubricService {
    // Rúbricas
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

        const rubricCriteriaResponse = await this.getCriteriaByRubricId(id);
        const rubricCriteria = Array.isArray(rubricCriteriaResponse.data) ? rubricCriteriaResponse.data : [];
        if (rubricCriteria.length < 2) {
            console.error(`No se puede publicar la rúbrica ${id}: requiere mínimo 2 criterios y solo tiene ${rubricCriteria.length}`);
            return {
                success: false,
                error: `No se puede publicar la rúbrica ${id}: requiere mínimo 2 criterios y solo tiene ${rubricCriteria.length}`,
            };
        }
        
        const criteriaScales = await Promise.all(rubricCriteria.map(c => this.getScaleByCriterionId(c.id)));
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


    //Criterios
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
        if (!criterion.rubric_id) {
            console.error("Se requiere el id de una rúbrica existente para asignar el criterio.");
            return {
                success: false,
                error: "Se requiere el id de una rúbrica existente para asignar el criterio.",
            };
        }

        const validation = await this.validateCriterionWeight(criterion.rubric_id, Number(criterion.weight) || 0);
        if (!validation.ok) {
            console.error(validation.message);
            return {
                success: false,
                error: validation.message,
            };
        }

        const rubricExists = await this._RubricExists(criterion.rubric_id);
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
        return apiService.put<Criterion>(`${API_URL_CRITERIA}/${id}`, criterion);
    }


    // Escalas
    // Método para obtener las escalas de un criterio específico.
    async getScaleByCriterionId(criterionId: string): Promise<ApiResponse<Scale[]>> {
        const response = await apiService.get<Scale[]>(API_URL_SCALES);
        const scales = Array.isArray(response.data) ? response.data : [];
        return {
            ...response,
            data: scales.filter(c => c.criterion_id === criterionId),
        };
    }

    // Método para obtener una escala por su ID.
    async getScaleById(id: string): Promise<ApiResponse<Scale>> {
        return apiService.get<Scale>(`${API_URL_SCALES}/${id}`);
    }
    
    // Método para crear una escala para un críterio.. 
    async createScale(scale: Omit<Scale, "id">): Promise<ApiResponse<Scale>> {
        if (!scale.criterion_id) {
            console.error("Se requiere el id de un criterio existente para asignar la escala.");
            return {
                success: false,
                error: "Se requiere el id de un criterio existente para asignar la escala.",
            };
        }

        const criterionExists = await this._CriterionExists(scale.criterion_id);
        if (!criterionExists) {
            return {
                success: false,
                error: `No existe el criterio con id ${scale.criterion_id}`,
            };
        }

        return apiService.post<Scale>(API_URL_SCALES, scale);
    }

    // Método para modificar una escala existente.
    async updateScale(id: string, scale: Partial<Scale>): Promise<ApiResponse<Scale>> {
        return apiService.put<Scale>(`${API_URL_SCALES}/${id}`, scale);
    }

    // Método para copiar una escala existente a otro criterio.
    async copyScaleToCriterion(scaleId: string, targetCriterionId: string): Promise<ApiResponse<Scale>> {
        const sourceScaleResponse = await this.getScaleById(scaleId);
        const sourceScale = sourceScaleResponse.data;
        if (!sourceScale) {
            console.error(`No existe la escala con id ${scaleId}`);
            return {
                success: false,
                error: `No existe la escala con id ${scaleId}`,
            };
        }

        if (!targetCriterionId) {
            console.error('Se requiere el id del criterio destino para copiar la escala.');
            return {
                success: false,
                error: 'Se requiere el id del criterio destino para copiar la escala.',
            };
        }

        const targetCriterionResponse = await this.getCriterionById(targetCriterionId);
        const targetCriterion = targetCriterionResponse.data;
        if (!targetCriterion) {
            console.error(`No existe el criterio destino con id ${targetCriterionId}`);
            return {
                success: false,
                error: `No existe el criterio destino con id ${targetCriterionId}`,
            };
        }

        const existingTargetScalesResponse = await this.getScaleByCriterionId(targetCriterionId);
        const existingTargetScales = Array.isArray(existingTargetScalesResponse.data) ? existingTargetScalesResponse.data : [];
        if (existingTargetScales.some(scale => scale.value === sourceScale.value)) {
            console.error(`El criterio destino ya tiene una escala con value ${sourceScale.value}`);
            return {
                success: false,
                error: `El criterio destino ya tiene una escala con value ${sourceScale.value}`,
            };
        }

        return await this.createScale({
            criterion_id: targetCriterionId,
            name: sourceScale.name,
            description: sourceScale.description,
            value: sourceScale.value,
        } as Omit<Scale, 'id'>);
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

    // Método que verifica si una rúbrica existe.
    async _RubricExists(id: string): Promise<boolean> { 
        const response = await this.getRubricById(id);
        if (!response.data) {
            console.error(`No existe la rúbrica con id ${id}`);
            return false;
        }
        return true;
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

export const rubricService = new RubricService();