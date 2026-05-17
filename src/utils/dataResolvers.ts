import { Criterion } from "../models/Criterion";
import { Scale } from "../models/Scale";
import { Enrollment } from "../models/Enrollment";
import studentService from "../services/student.service";

export function getCriterionById(criteria: Criterion[], id: string): Criterion | undefined {
  return criteria.find((c) => c.id === id);
}

export function getScaleById(scalesByCriterion: Record<string, Scale[]>, scaleId: string): { scale?: Scale; criterionId?: string } {
  for (const [criterionId, scales] of Object.entries(scalesByCriterion)) {
    const found = scales.find((s) => s.id === scaleId);
    if (found) return { scale: found, criterionId };
  }
  return {};
}

export function getScaleLabel(scale?: Scale): string {
  if (!scale) return "";
  return scale.name ?? String(scale.value ?? "");
}

/**
 * Construye los detalles de la calificación (payload.details).
 * Retorna null si falta una escala para algún criterio.
 */
export function buildGradeDetails(
  criteria: Criterion[],
  selectedScales: Record<string, string>,
  criterionComments: Record<string, string>
): Array<{ scale_id: string; comment?: string }> | null {
  const details = criteria.map((criterion) => {
    const scaleId = selectedScales[criterion.id];
    if (!scaleId) return null;
    const comment = criterionComments[criterion.id]?.trim();
    return { scale_id: scaleId, ...(comment ? { comment } : {}) };
  });

  if (details.some((d) => d === null)) return null;
  return details as Array<{ scale_id: string; comment?: string }>;
}

/**
 * Resuelve el código y el correo del estudiante a partir de un objeto Enrollment.
 * Devuelve valores por defecto cuando no se puede resolver.
 */
export async function resolveStudentInfo(enrollment: Enrollment): Promise<{ student_code: string; email: string }> {
  try {
    const academicStudentResp = await studentService.getAcademicStudentById(enrollment.student_id);
    const academicStudent = academicStudentResp?.data;

    if (!academicStudent) {
      return { student_code: "N/A", email: "N/A" };
    }

    if (academicStudent.user_id) {
      const userResp = await studentService.getStudentById(academicStudent.user_id);
      const user = (userResp as any)?.data ?? userResp;

      return {
        student_code: user?.code ?? academicStudent?.identification ?? "N/A",
        email: user?.email ?? "N/A",
      };
    }

    return {
      student_code: academicStudent?.identification ?? "N/A",
      email: "N/A",
    };
  } catch {
    return { student_code: "N/A", email: "N/A" };
  }
}