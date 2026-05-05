import apiClient from '../interceptor/apiClient';
import { Grade } from '../models/Grade';
import { GradeDetail } from '../models/GradeDetail';

const API_URL_GRADES = '/evaluation/grades';

class GradeService {
	private _validateSavePayload(payload: {
		enrollment_id: string;
		evaluation_id?: string;
		rubric_id?: string;
		details: Array<{ scale_id: string; comment?: string }>;
		status?: string;
		observations?: string;
	}): string | null {
		if (!payload?.enrollment_id) {
			return 'enrollment_id is required';
		}

		if (!payload.evaluation_id && !payload.rubric_id) {
			return 'evaluation_id or rubric_id is required';
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
	async getGrades(): Promise<Grade[]> {
		try {
			const response = await apiClient.get(API_URL_GRADES);
			const gradeData = this._extractData(response);
			return Array.isArray(gradeData) ? gradeData as Grade[] : [];
		} catch (error) {
			return this._handleError(error) || [];
		}
	}

	// Método para obtener una nota específica por su ID junto con sus detalles.
	async getGradeById(id: string): Promise<Grade | null> {
		try {
			const response = await apiClient.get(`${API_URL_GRADES}/${id}`);
			const gradeData = this._extractData(response);
			return gradeData as Grade | null;
		} catch (error) {
			return this._handleError(error);
		}
	}

	// Método para obtener los detalles de una nota específica.
	async getGradeDetailsByGradeId(id: string): Promise<GradeDetail[]> {
		try {
			const grade = await this.getGradeById(id);
			return grade?.details ?? [];
		} catch (error) {
			return this._handleError(error) || [];
		}
	}

	// Método para obtener una nota específica por su ID.
	async getGradesByRubricId(rubricId: string): Promise<Grade[]> {
		try {
			const grades = await this.getGrades();
			return grades.filter(grade => grade.rubric_id === rubricId);
		} catch (error) {
            return this._handleError(error) || [];
        }
		
	}

	// Método centralizado para crear la nota y sus detalles en una sola llamada.
	async saveGrade(payload: {
		enrollment_id: string;
		evaluation_id?: string;
		rubric_id?: string;
		details: Array<{ scale_id: string; comment?: string }>;
		status?: string;
		observations?: string;
	}): Promise<Grade | null> {
		const validationError = this._validateSavePayload(payload);
		if (validationError) {
			console.error(validationError);
			return null;
		}

		try {
			const response = await apiClient.post(API_URL_GRADES, payload);
			return this._extractData(response) as Grade | null;
		} catch (error) {
			return this._handleError(error);
		}
	}

    // Método para modificar una nota existente.
    async updateGrade(id: string, grade: Partial<Grade>): Promise<Grade | null> {
        try {
            const response = await apiClient.put<Grade>(`${API_URL_GRADES}/${id}`, grade
			);
            return response.data;
        } catch (error) {
            return this._handleError(error);
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
			console.error('Servidor respondió con error:', error.response.status);
			if (error.response.data) {
				console.error('Detalle del backend:', error.response.data);
			}
		} else if (error.request) {
			console.error('No se recibió respuesta (¿Back apagado?):', error.request);
		}
		return null;
	}
}

export const gradeService = new GradeService();