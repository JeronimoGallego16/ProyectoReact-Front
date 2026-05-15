/**
 * Referencia a la relación StudyPlan <-> Subject (M:N)
 * En backend: tabla asociativa sin id (secondary association)
 * Uso: representar qué asignaturas pertenecen a qué plan de estudio
 */
export interface StudyPlanSubject {
  study_plan_id: string;
  subject_id: string;
}

export type StudyPlanSubjectCreateInput = StudyPlanSubject;
