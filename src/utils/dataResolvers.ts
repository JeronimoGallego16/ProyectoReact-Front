import { Criterion } from "../models/Criterion";
import { Scale } from "../models/Scale";
import { Enrollment } from "../models/Enrollment";
import { Evaluation } from "../models/Evaluation";
import { Group } from "../models/Group";
import { Rubric } from "../models/Rubric";
import { Subject } from "../models/Subject";
import { User } from "../models/user";
import studentService from "../services/student.service";
import { criterionService } from "../services/CriterionService";
import { scaleService } from "../services/ScaleService";
import { evaluationService } from "../services/EvaluationService";
import { groupService } from "../services/GroupService";
import { subjectService } from "../services/SubjectService";
import { enrollmentService } from "../services/EnrollmentService";
import { evaluationAuthorizationService } from "../utils/EvalationAuthorizationService";

export function extractList<T = any>(response: any): T[] {
  if (Array.isArray(response)) return response as T[];
  if (Array.isArray(response?.data)) return response.data as T[];
  return [];
}

export function extractItem<T = any>(response: any): T | null {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data?: T | null }).data ?? null;
  }
  return (response ?? null) as T | null;
}

export async function canUserViewRubric(user: User | null, rubric?: Rubric | null, allEvaluations?: Evaluation[]): Promise<boolean> {
  if (!user || !rubric) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "TEACHER") return true;

  const evaluation = Array.isArray(allEvaluations)
    ? allEvaluations.find((currentEvaluation) => currentEvaluation.rubric_id === rubric.id)
    : undefined;

  if (evaluation) {
    return evaluationAuthorizationService.canViewRubric(user, evaluation.id, allEvaluations, rubric);
  }

  return rubric.is_public !== false;
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
 * Resuelve código y correo a partir de un academicStudent id (student detail id).
 * Útil cuando no se dispone del objeto `Enrollment` sino del academic student id.
 */
export async function resolveStudentInfoByAcademicStudentId(academicStudentId?: string): Promise<{ student_code: string; email: string }> {
  if (!academicStudentId) return { student_code: "N/A", email: "N/A" };

  try {
    const academicStudentResp = await studentService.getAcademicStudentById(academicStudentId);
    const academicStudent = academicStudentResp?.data;

    if (!academicStudent) return { student_code: "N/A", email: "N/A" };

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

export async function fetchCriteriaAndScalesByRubric(
  rubricId: string
): Promise<{ criteria: Criterion[]; scalesByCriterion: Record<string, Scale[]> }> {
  if (!rubricId) {
    return { criteria: [], scalesByCriterion: {} };
  }

  try {
    const criteriaResponse = await criterionService.getCriteriaByRubricId(rubricId);
    const criteria = Array.isArray(criteriaResponse.data) ? criteriaResponse.data : [];

    const scalesEntries = await Promise.all(
      criteria.map(async (criterion) => {
        const scalesResponse = await scaleService.getScaleByCriterionId(criterion.id);
        return [criterion.id, Array.isArray(scalesResponse.data) ? scalesResponse.data : []] as const;
      })
    );

    return {
      criteria,
      scalesByCriterion: Object.fromEntries(scalesEntries),
    };
  } catch {
    return { criteria: [], scalesByCriterion: {} };
  }
}

export async function resolveEvaluationContext(
  evaluationId: string
): Promise<{ evaluation: Evaluation | null; group: Group | null; subject: Subject | null; enrollments: Enrollment[] }> {
  if (!evaluationId) {
    return { evaluation: null, group: null, subject: null, enrollments: [] };
  }

  try {
    const evaluationResp = await evaluationService.getEvaluationById(evaluationId);
    const evaluation = evaluationResp.data ?? null;

    const [group, subject] = await Promise.all([
      evaluation?.group_id ? groupService.getGroupById(evaluation.group_id) : Promise.resolve<Group | null>(null),
      evaluation?.subject_id ? subjectService.getSubjectById(evaluation.subject_id) : Promise.resolve<Subject | null>(null),
    ]);

    const enrollments = group?.id ? await enrollmentService.getEnrollmentsByGroup(group.id) : [];

    return {
      evaluation,
      group,
      subject,
      enrollments: Array.isArray(enrollments) ? enrollments : [],
    };
  } catch {
    return { evaluation: null, group: null, subject: null, enrollments: [] };
  }
}