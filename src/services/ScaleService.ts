import apiService, { ApiResponse } from './api';
import { Scale } from '../models/Scale';
import { criterionService } from './CriterionService';

const API_URL_SCALES = '/evaluation/scales'

// Clase que gestiona las operaciones relacionadas con las escalas.
class ScaleService {
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

        const criterionExists = await criterionService._CriterionExists(scale.criterion_id);
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

    // Método para eliminar una escala por su ID.
    async deleteScale(id: string): Promise<ApiResponse<any>> {
        return apiService.delete<any>(`${API_URL_SCALES}/${id}`);
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

        const targetCriterionResponse = await criterionService.getCriterionById(targetCriterionId);
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
}

export const scaleService = new ScaleService();