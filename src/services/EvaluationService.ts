import apiClient from '../interceptor/apiClient';
import { Evaluation } from '../models/Evaluation';
import { gradeService } from './GradeService';
import { rubricService } from './RubricService';

const API_URL_EVALUATIONS = '/evaluation/evaluations';

class EvaluationService {
    // Método para obtener una lista de evaluaciones.
    async getEvaluations(): Promise<Evaluation[]> {
        try {
            const response = await apiClient.get(API_URL_EVALUATIONS);
            const evaluationData = this._extractData(response);
            return Array.isArray(evaluationData) ? evaluationData as Evaluation[] : [];
        } catch (error) {
            return this._handleError(error) || [];
        } 
    }

    // Metodo para obtener una evaluacion específica por su ID.
    async getEvaluationById(id: string): Promise<Evaluation | null> {
        try {
            const response = await apiClient.get(`${API_URL_EVALUATIONS}/${id}`);
            const data = this._extractData(response);
            return data as Evaluation || null;
        } catch (error) {
            return this._handleError(error);
        }
    }
    
    // Método para crear una nueva evaluación.
    async createEvaluation(evaluation: Omit<Evaluation, "id">): Promise<Evaluation | null> {
        try {
            const response = await apiClient.post(API_URL_EVALUATIONS, evaluation);
            return response.data;
        } catch (error) {
            return this._handleError(error);
        }
    }

    // Método para modificar una evaluación existente.
    async updateEvaluation(id: string, evaluation: Partial<Evaluation>): Promise<Evaluation | null> {
        try {
            const response = await apiClient.put(`${API_URL_EVALUATIONS}/${id}`, evaluation);
            return response.data;
        } catch (error) {
            return this._handleError(error);
        }
    }

    async associateRubric(evaluationId: string, rubricId: string): Promise<Evaluation | null> {
        try {
            const evaluation = await this.getEvaluationById(evaluationId);
            if (!evaluation) {
                console.error('No se puedo encontrar la evaluación la rúbrica.');
                return null;
            }
    
            if (evaluation.rubric_id && evaluation.rubric_id !== rubricId) {
                const grades = await gradeService.getGradesByRubricId(evaluation.rubric_id);
                if (grades.data && grades.data.length > 0) {
                    return null;
                }
            }

            const rubric = await rubricService.getRubricById(rubricId);
            if (!rubric || !rubric.is_public || rubric.is_archived) {
                console.error('No se puede asociar la rúbrica. Verifique que exista y sea pública.');
                return null;
            }

            const response = await apiClient.patch(`${API_URL_EVALUATIONS}/${evaluationId}/associate-rubric/${rubricId}`);
            return this._extractData(response) as Evaluation | null;
        } catch (error) {
            return this._handleError(error);
        }
    }

    // Método para eliminar una evaluación.
    async deleteEvaluation(id: string): Promise<boolean> {
        try {
            const evaluation = await this.getEvaluationById(id);
            if (!evaluation) {
                console.error(`Evaluación con ID ${id} no encontrada para eliminación.`);
                return false;
            }
            await apiClient.delete(`${API_URL_EVALUATIONS}/${id}`);
            return true;
        } catch (error) {
            this._handleError(error);
            return false;
        }   
    }


    // Helpers
    // Método para extraer datos que pueden venir en { data: { data: ... } } o { data: ... }
    _extractData(response: any): any {
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
};

export const evaluationService = new EvaluationService();