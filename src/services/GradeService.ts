import apiService, { ApiResponse } from './api';
import { Grade } from '../models/Grade';
import { GradeDetail } from '../models/GradeDetail';

const API_URL_GRADES = '/evaluation/grades';
const API_URL_GROUP_FINAL_SCORES = '/evaluation/groups';

class GradeService {
	private _validateSavePayload(payload: {
		enrollment_id: string;
		rubric_id: string;
		details: Array<{ scale_id: string; comment?: string }>;
		status?: string;
		observations?: string;
	}): string | null {
		if (!payload?.enrollment_id) {
			return 'enrollment_id is required';
		}

		if (!payload?.rubric_id) {
			return 'rubric_id is required';
		}

		if (!Array.isArray(payload.details) || payload.details.length === 0) {
			return 'at least one grade detail is required';
		}

		if (payload.details.some(detail => !detail.scale_id)) {
			return 'each grade detail must include a scale_id';
		}

		return null;
	}

	// Método para obtener una lista de notas.
	async getGrades(): Promise<ApiResponse<Grade[]>> {
		return apiService.get<Grade[]>(API_URL_GRADES);
	}

	// Método para obtener una nota específica por su ID junto con sus detalles.
	async getGradeById(id: string): Promise<ApiResponse<Grade>> {
		return apiService.get<Grade>(`${API_URL_GRADES}/${id}`);
	}

	// Método para obtener los detalles de una nota específica.
	async getGradeDetailsByGradeId(id: string): Promise<ApiResponse<GradeDetail[]>> {
		const response = await this.getGradeById(id);
		const details = response.data?.details ?? [];
		return {
			...response,
			data: details,
		};
	}

	// Método para obtener una nota específica por su ID.
	async getGradesByRubricId(rubricId: string): Promise<ApiResponse<Grade[]>> {
		const response = await this.getGrades();
		const grades = Array.isArray(response.data) ? response.data : [];
		return {
			...response,
			data: grades.filter(grade => grade.rubric_id === rubricId),
		};
	}

	// Recalcula y publica las notas finales ponderadas de un grupo completo.
	async registerFinalScoresByGroup(groupId: string): Promise<ApiResponse<any>> {
		if (!groupId) {
			return {
				success: false,
				error: 'group_id is required',
			};
		}

		return apiService.post<any>(`${API_URL_GROUP_FINAL_SCORES}/${groupId}/register-final-scores`, {});
	}

	// Método centralizado para crear la nota y sus detalles en una sola llamada.
	async saveGrade(payload: {
		enrollment_id: string;
		rubric_id: string;
		details: Array<{ scale_id: string; comment?: string }>;
		status?: string;
		observations?: string;
	}): Promise<ApiResponse<Grade>> {
		const validationError = this._validateSavePayload(payload);
		if (validationError) {
			console.error(validationError);
			return {
				success: false,
				error: validationError,
			};
		}

		return apiService.post<Grade>(API_URL_GRADES, payload);
	}

    // Método para modificar una nota existente.
	async updateGrade(id: string, grade: Partial<Grade>): Promise<ApiResponse<Grade>> {
		// If the payload includes fields that must be validated, do simple checks
		if (grade) {
			if (Object.prototype.hasOwnProperty.call(grade, 'enrollment_id')) {
				if (!grade.enrollment_id) {
					console.error('enrollment_id is required');
					return { success: false, error: 'enrollment_id is required' };
				}
			}
			if (Object.prototype.hasOwnProperty.call(grade, 'rubric_id')) {
				if (!grade.rubric_id) {
					console.error('rubric_id is required');
					return { success: false, error: 'rubric_id is required' };
				}
			}
			if (Object.prototype.hasOwnProperty.call(grade, 'details')) {
				const details = (grade as Partial<Grade>).details;
				if (!Array.isArray(details) || details.length === 0) {
					console.error('at least one grade detail is required');
					return { success: false, error: 'at least one grade detail is required' };
				}
				if (details.some(d => !d.scale_id)) {
					console.error('each grade detail must include a scale_id');
					return { success: false, error: 'each grade detail must include a scale_id' };
				}
			}
		}

		return apiService.put<Grade>(`${API_URL_GRADES}/${id}`, grade);
	}
}

export const gradeService = new GradeService();
