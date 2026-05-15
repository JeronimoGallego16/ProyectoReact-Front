import apiClient from '../interceptor/apiClient';
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
    async getRubrics(): Promise<Rubric[]> {
        try {
            const response = await apiClient.get(API_URL_RUBRICS);
            const rubricData = this._extractData(response);
            return Array.isArray(rubricData) ? rubricData as Rubric[] : [];
        } catch (error) {
            return this._handleError(error) || [];
        }
    }

    // Método para obtener una rúbrica por su ID.
    async getRubricById(id: string): Promise<Rubric | null> {
        try {
            const response = await apiClient.get(`${API_URL_RUBRICS}/${id}`);
            const data = this._extractData(response);
            return data as Rubric || null;
        } catch (error) {
            return this._handleError(error);
        }
    } 

    // Método para crear una nueva rúbrica.
    async createRubric(rubric: Omit<Rubric, "id">): Promise<Rubric | null> {
        try {
            const response = await apiClient.post<Rubric>(API_URL_RUBRICS, rubric);
            return response.data;
         } catch (error) {
            return this._handleError(error);
        }
    }

    // Método para modificar una rúbrica existente.
    async updateRubric(id: string, rubric: Partial<Rubric>): Promise<Rubric | null> {
        try {
            const response = await apiClient.put<Rubric>(`${API_URL_RUBRICS}/${id}`, rubric);
            return response.data;
        } catch (error) {
            return this._handleError(error);
        }
    }

    // Método para publicar una rúbrica.
    async publishRubric(id: string): Promise<Rubric | null> {
        try {
            const rubric = await this.getRubricById(id);
            if (!rubric) return null;

            if (rubric.is_public) {
                console.warn(`La rúbrica ${id} ya está publicada.`);
                return rubric;
            }

            const rubricCriteria = await this.getCriteriaByRubricId(id);
            if (rubricCriteria.length < 2) {
                console.error(`No se puede publicar la rúbrica ${id}: requiere mínimo 2 criterios y solo tiene ${rubricCriteria.length}`);
                return null;
            }
            
            const criteriaScales = await Promise.all(rubricCriteria.map(c => this.getScaleByCriterionId(c.id)));
            if (criteriaScales.some(scales => scales.length < 2)) {
                console.error(`No se puede publicar la rúbrica ${id}: cada criterio requiere mínimo 2 escalas`);
                return null;
            }

            const response = await apiClient.patch(`${API_URL_RUBRICS}/${id}/publish`, { is_public: true, is_archived: false });
            const publishedRubric = this._extractData(response) as Rubric | null;

            const normalizedRubric = await this.updateRubric(id, { is_public: true, is_archived: false });
            return normalizedRubric || publishedRubric || null;
        } catch (error) {
            return this._handleError(error);
        }
    }

    // Método para eliminar una rúbrica.
    async deleteRubric(id: string): Promise<boolean> {
        try {
            const rubric = await this.getRubricById(id);
            if (!rubric || rubric.is_public) {
                console.error(`No se puede eliminar porque la rúbrica está publicada. Debes archivarla.`);
                return false;
            }

            await apiClient.delete(`${API_URL_RUBRICS}/${id}`);
            return true;
        } catch (error) {
            this._handleError(error);
            return false;
        }
    }

    // Método para archivar una rúbrica.
    async archiveRubric(id: string): Promise<boolean> {
        try {
            const rubric = await this.getRubricById(id);
            if (!rubric || rubric.is_archived) {
                console.error(`La rúbrica ya está archivada.`);
                return false;
            }

            await this.updateRubric(id, { is_archived: true, is_public: false });
            return true;
        } catch (error) {
            this._handleError(error);
            return false;
        }
    }


    //Criterios
    // Método para obtener los criterios de una rúbrica específica.
    async getCriteriaByRubricId(rubricId: string): Promise<Criterion[]> {
        try {
            const response = await apiClient.get(API_URL_CRITERIA);
            const criteriaData = this._extractData(response);
            const criteria = Array.isArray(criteriaData) ? criteriaData as Criterion[] : [];
            return criteria.filter(c => c.rubric_id === rubricId);
        } catch (error) {
            return this._handleError(error) || [];
        }
    }

    // Método para obtener un criterio por su ID.
    async getCriterionById(id: string): Promise<Criterion | null> {
        try {
            const response = await apiClient.get(`${API_URL_CRITERIA}/${id}`);
            const data = this._extractData(response);
            return data as Criterion || null;
        } catch (error) {
            return this._handleError(error);
        }
    } 

    // Método para crear un criterio para una rúbrica. 
    async createCriterion(criterion: Omit<Criterion, "id">): Promise<Criterion | null> {
        try {
            if (!criterion.rubric_id) {
                console.error("Se requiere el id de una rúbrica existente para asignar el criterio.");
                return null;
            }

            const validation = await this.validateCriterionWeight(criterion.rubric_id, Number(criterion.weight) || 0);
            if (!validation.ok) {
                console.error(validation.message);
                return null;
            }

            await this._RubricExists(criterion.rubric_id);

            const response = await apiClient.post<Criterion>(API_URL_CRITERIA, criterion);
            return response.data;
         } catch (error) {
            return this._handleError(error);
        }
    }

    // Método para modificar un criterio existente.
    async updateCriterion(id: string, criterion: Partial<Criterion>): Promise<Criterion | null> {
        try {
            const response = await apiClient.put<Criterion>(`${API_URL_CRITERIA}/${id}`, criterion);
            return response.data;
        } catch (error) {
            return this._handleError(error);
        }
    }


    // Escalas
    // Método para obtener las escalas de un criterio específico.
    async getScaleByCriterionId(criterionId: string): Promise<Scale[]> {
        try {
            const response = await apiClient.get(API_URL_SCALES);
            const scaleData = this._extractData(response);
            const scales = Array.isArray(scaleData) ? scaleData as Scale[] : [];
            return scales.filter(c => c.criterion_id === criterionId);
        } catch (error) {
            return this._handleError(error) || [];
        }
    }

    // Método para obtener una escala por su ID.
    async getScaleById(id: string): Promise<Scale | null> {
        try {
            const response = await apiClient.get(`${API_URL_SCALES}/${id}`);
            const data = this._extractData(response);
            return data as Scale || null;
        } catch (error) {
            return this._handleError(error);
        }
    }
    
    // Método para crear una escala para un críterio.. 
    async createScale(scale: Omit<Scale, "id">): Promise<Scale | null> {
        try {
            if (!scale.criterion_id) {
                console.error("Se requiere el id de un criterio existente para asignar la escala.");
                return null;
            }

            await this._CriterionExists(scale.criterion_id);

            const response = await apiClient.post<Scale>(API_URL_SCALES, scale);
            return response.data;
         } catch (error) {
            return this._handleError(error);
        }
    }

    // Método para modificar una escala existente.
    async updateScale(id: string, scale: Partial<Scale>): Promise<Scale | null> {
        try {
            const response = await apiClient.put<Scale>(`${API_URL_SCALES}/${id}`, scale);
            return response.data;
        } catch (error) {
            return this._handleError(error);
        }
    }

    // Método para copiar una escala existente a otro criterio.
    async copyScaleToCriterion(scaleId: string, targetCriterionId: string): Promise<Scale | null> {
        try {
            const sourceScale = await this.getScaleById(scaleId);
            if (!sourceScale) {
                console.error(`No existe la escala con id ${scaleId}`);
                return null;
            }

            if (!targetCriterionId) {
                console.error('Se requiere el id del criterio destino para copiar la escala.');
                return null;
            }

            const targetCriterion = await this.getCriterionById(targetCriterionId);
            if (!targetCriterion) {
                console.error(`No existe el criterio destino con id ${targetCriterionId}`);
                return null;
            }

            const existingTargetScales = await this.getScaleByCriterionId(targetCriterionId);
            if (existingTargetScales.some(scale => scale.value === sourceScale.value)) {
                console.error(`El criterio destino ya tiene una escala con value ${sourceScale.value}`);
                return null;
            }

            return await this.createScale({
                criterion_id: targetCriterionId,
                name: sourceScale.name,
                description: sourceScale.description,
                value: sourceScale.value,
            } as Omit<Scale, 'id'>);
        } catch (error) {
            return this._handleError(error);
        }
    }

    // Valida que el nuevo criterio no haga que la suma de pesos supere 100.
    async validateCriterionWeight(rubricId: string, newWeight: number): Promise<{ ok: boolean; message?: string; total: number; remaining: number; projectedTotal: number }> {
        const rubricCriteria = await this.getCriteriaByRubricId(rubricId);
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


    // Helpers
    // Método para extraer datos que pueden venir en { data: { data: ... } } o { data: ... }
    _extractData(response: any) {
        if (!response) return null;
        if (response.data && response.data.data !== undefined) return response.data.data;
        if (response.data !== undefined) return response.data;
        return null;
    }

    // Método para mostrar un mensaje de error por conexión al backend fallida.
    _handleError(error: any) {
        if (error.response) {
            console.error("Servidor respondió con error:", error.response.status);
            if (error.response.data) {
                console.error("Detalle del backend:", error.response.data);
            }
        } else if (error.request) {
            console.error("No se recibió respuesta (¿Back apagado?):", error.request);
        }
        return null;
    }

    // Método que verifica si una rúbrica existe.
    async _RubricExists(id: string): Promise<boolean> { 
        if (!await this.getRubricById(id)) {
            console.error(`No existe la rúbrica con id ${id}`);
                return false;
            }
        return true;
    }

    // Método que verifica si un criterio existe.
    async _CriterionExists(id: string): Promise<boolean> { 
        if (!await this.getCriterionById(id)) {
            console.error(`No existe el criterio con id ${id}`);
                return false;
            }
        return true;
    }

}

export const rubricService = new RubricService();