import apiService, { ApiResponse } from './api';
import { Evaluation } from '../models/Evaluation';
import { gradeService } from './GradeService';
import { enrollmentService } from './EnrollmentService';
import { rubricService } from './RubricService';
import { validatePositiveNumber, validateRequiredText } from '../utils/validation.ts';

const API_URL_EVALUATIONS = '/evaluation/evaluations';

class EvaluationService {
    // Método para obtener una lista de evaluaciones.
    async getEvaluations(): Promise<ApiResponse<Evaluation[]>> {
        return apiService.get<Evaluation[]>(API_URL_EVALUATIONS);
    }

    // Metodo para obtener una evaluacion específica por su ID.
    async getEvaluationById(id: string): Promise<ApiResponse<Evaluation>> {
        return apiService.get<Evaluation>(`${API_URL_EVALUATIONS}/${id}`);
    }

    // Método para crear una nueva evaluación.
    async createEvaluation(evaluation: Omit<Evaluation, "id">): Promise<ApiResponse<Evaluation>> {
        // Simple validation based on required model attributes
        if (!evaluation) {
            return { success: false, error: 'Payload de evaluación inválido.' };
        }

        const nameError = validateRequiredText(evaluation.name, 'El nombre de la evaluación es obligatorio.');
        if (nameError) {
            console.error(nameError);
            return { success: false, error: nameError };
        }

        const groupIdError = validateRequiredText(evaluation.group_id, 'El grupo (group_id) de la evaluación es obligatorio.');
        if (groupIdError) {
            console.error(groupIdError);
            return { success: false, error: groupIdError };
        }

        const subjectIdError = validateRequiredText(evaluation.subject_id, 'La asignatura (subject_id) de la evaluación es obligatoria.');
        if (subjectIdError) {
            console.error(subjectIdError);
            return { success: false, error: subjectIdError };
        }

        const weightError = validatePositiveNumber(
            evaluation.weight,
            'El peso de la evaluación es obligatorio y debe ser mayor que 0.'
        );
        if (weightError) {
            console.error(weightError);
            return { success: false, error: weightError };
        }

        return apiService.post<Evaluation>(API_URL_EVALUATIONS, evaluation);
    }

    // Método para modificar una evaluación existente.
    async updateEvaluation(id: string, evaluation: Partial<Evaluation>): Promise<ApiResponse<Evaluation>> {
        if (evaluation && Object.prototype.hasOwnProperty.call(evaluation, 'name')) {
            const nameError = validateRequiredText(evaluation.name, 'El nombre de la evaluación no puede estar vacío.');
            if (nameError) {
                console.error(nameError);
                return { success: false, error: nameError };
            }
        }

        if (evaluation && Object.prototype.hasOwnProperty.call(evaluation, 'weight')) {
            const weightError = validatePositiveNumber(
                evaluation.weight,
                'El peso de la evaluación debe ser mayor que 0.'
            );
            if (weightError) {
                console.error(weightError);
                return { success: false, error: weightError };
            }
        }

        return apiService.put<Evaluation>(`${API_URL_EVALUATIONS}/${id}`, evaluation);
    }

    async associateRubric(evaluationId: string, rubricId: string): Promise<ApiResponse<Evaluation>> {
        const evaluationResponse = await this.getEvaluationById(evaluationId);
        const evaluation = evaluationResponse.data;
        if (!evaluation) {
            console.error('No se puedo encontrar la evaluación la rúbrica.');
            return {
                success: false,
                error: 'No se puedo encontrar la evaluación la rúbrica.',
            };
        }

        if (evaluation.rubric_id && evaluation.rubric_id !== rubricId) {
            const gradesResponse = await gradeService.getGradesByRubricId(evaluation.rubric_id);
            const grades = Array.isArray(gradesResponse.data) ? gradesResponse.data : [];

            // Sólo considerar como bloqueo las notas que pertenecen a la misma evaluación (mismo group_id).
            // Para ello, obtenemos la inscripción (enrollment) de cada nota y comparamos su group_id con evaluation.group_id.
            let hasGradesInThisEvaluation = false;
            for (const g of grades) {
                const enrollment = await enrollmentService.getEnrollmentById(g.enrollment_id);
                if (enrollment && enrollment.group_id && evaluation.group_id && enrollment.group_id === evaluation.group_id) {
                    hasGradesInThisEvaluation = true;
                    break;
                }
            }

            if (hasGradesInThisEvaluation) {
                console.log('La evaluación ya tiene notas asociadas a su rúbrica actual. No se puede cambiar la rúbrica.');
                return {
                    success: false,
                    error: 'La evaluación ya tiene notas asociadas a su rúbrica actual. No se puede cambiar la rúbrica.',
                };
            }
        }

        const rubricResponse = await rubricService.getRubricById(rubricId);
        const rubric = rubricResponse.data;
        if (!rubric || !rubric.is_public || rubric.is_archived) {
            console.error('No se puede asociar la rúbrica. Verifique que exista y sea pública.');
            return {
                success: false,
                error: 'No se puede asociar la rúbrica. Verifique que exista y sea pública.',
            };
        }

        return apiService.patch<Evaluation>(`${API_URL_EVALUATIONS}/${evaluationId}/associate-rubric/${rubricId}`, {});
    }

    // Método para eliminar una evaluación.
    async deleteEvaluation(id: string): Promise<ApiResponse<any>> {
        const evaluationResponse = await this.getEvaluationById(id);
        const evaluation = evaluationResponse.data;
        if (!evaluation) {
            console.error(`Evaluación con ID ${id} no encontrada para eliminación.`);
            return {
                success: false,
                error: `Evaluación con ID ${id} no encontrada para eliminación.`,
            };
        }

        return apiService.delete<any>(`${API_URL_EVALUATIONS}/${id}`);
    }
};

export const evaluationService = new EvaluationService();