import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import CriterionCommentBox from "../../components/CriterionCommentBox";
import EntityHeader from "../../components/EntityHeader";
import PageHeader from "../../components/PageHeader";
import SelectableTable from "../../components/SelectableTable";
import { showToast } from "../../hooks/fireToast";
import useCalificationDraft from "../../hooks/useCalificationDraft";

import { Evaluation } from "../../models/Evaluation";
import { Criterion } from "../../models/Criterion";
import { Scale } from "../../models/Scale";

import { evaluationService } from "../../services/EvaluationService";
import { gradeService } from "../../services/GradeService";
import { enrollmentService } from "../../services/EnrollmentService";

import { buildGradeDetails, fetchCriteriaAndScalesByRubric, resolveStudentInfoByAcademicStudentId } from "../../utils/dataResolvers";

const SCALE_COLUMNS = ["name", "description", "value"];

const CalificationDetailPage: React.FC = () => {
    const { evaluationId, enrollmentId } = useParams<{ evaluationId: string; enrollmentId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { saveDraft, loadDraft, clearDraft } = useCalificationDraft();

    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [student, setStudent] = useState<{ id: string; student_code: string; email: string; enrollment_id: string } | null>(null);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [scalesByCriterion, setScalesByCriterion] = useState<Record<string, Scale[]>>({});
    const [loading, setLoading] = useState(true);
    const [selectedScales, setSelectedScales] = useState<Record<string, string>>({});
    const [criterionComments, setCriterionComments] = useState<Record<string, string>>({});
    const [openCommentCriterionId, setOpenCommentCriterionId] = useState<string | null>(null);
    const [savingGrade, setSavingGrade] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);

    const loadData = async () => {
        if (!evaluationId || !enrollmentId) return;

        setLoading(true);
        let draftRestored = false;
        try {
            const evaluationResp = await evaluationService.getEvaluationById(evaluationId);
            const evaluationData = evaluationResp.data || null;
            setEvaluation(evaluationData);

            if (evaluationData?.rubric_id) {
                const { criteria: rubricCriteria, scalesByCriterion: nextScalesByCriterion } = await fetchCriteriaAndScalesByRubric(evaluationData.rubric_id);
                setCriteria(rubricCriteria);
                setScalesByCriterion(nextScalesByCriterion);

                const shouldLoadDraft = searchParams.get("draft") === "1";
                if (shouldLoadDraft) {
                    const draft = loadDraft(evaluationId, enrollmentId);
                    const currentCriterionIds = new Set(rubricCriteria.map((criterion) => criterion.id));

                    if (draft) {
                        const restoredScales = Object.fromEntries(
                            Object.entries(draft.selectedScales).filter(([criterionKey]) => currentCriterionIds.has(criterionKey))
                        );
                        const restoredComments = Object.fromEntries(
                            Object.entries(draft.criterionComments).filter(([criterionKey]) => currentCriterionIds.has(criterionKey))
                        );

                        setSelectedScales(restoredScales);
                        setCriterionComments(restoredComments);
                        setOpenCommentCriterionId(null);
                        draftRestored = true;
                    }
                }
            } else {
                setCriteria([]);
                setScalesByCriterion({});
            }

            const enrollments = evaluationData?.group_id
                ? await enrollmentService.getEnrollmentsByGroup(evaluationData.group_id)
                : [];

            const enrollment = enrollments.find((currentEnrollment) => currentEnrollment.id === enrollmentId) ?? null;
            if (!enrollment) {
                setStudent(null);
                return;
            }

            const info = await resolveStudentInfoByAcademicStudentId(enrollment.student_id);
            setStudent({
                id: enrollment.id,
                enrollment_id: enrollment.id,
                student_code: info.student_code,
                email: info.email,
            });

            if (!draftRestored) {
                setSelectedScales({});
                setCriterionComments({});
                setOpenCommentCriterionId(null);
            }
        } catch {
            showToast("Error", "No se pudo cargar la información de la calificación.", 2);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [evaluationId, enrollmentId, searchParams]);

    const getSubtitle = (): string => {
        const pieces: string[] = [];

        if (evaluation?.description) {
            pieces.push(evaluation.description);
        }

        if (evaluation?.weight !== undefined) {
            pieces.push(`Peso: ${evaluation.weight}`);
        }

        return pieces.length > 0 ? pieces.join(" • ") : "";
    };

    const handleScaleSelect = (criterionId: string, scaleId: string) => {
        setSelectedScales((prev) => ({
            ...prev,
            [criterionId]: scaleId,
        }));
    };

    const toggleCriterionComment = (criterionId: string) => {
        setOpenCommentCriterionId((prev) => (prev === criterionId ? null : criterionId));
    };

    const handleCommentChange = (criterionId: string, value: string) => {
        setCriterionComments((prev) => ({
            ...prev,
            [criterionId]: value,
        }));
    };

    const buildGradePayload = () => {
        if (!student || !evaluation?.rubric_id) {
            return null;
        }

        const details = buildGradeDetails(criteria, selectedScales, criterionComments);
        if (!details) return null;

        return {
            enrollment_id: student.enrollment_id,
            rubric_id: evaluation.rubric_id,
            details,
            status: "SENT",
        };
    };

    const goBackToList = () => {
        if (evaluationId) {
            navigate(`/evaluations/${evaluationId}/califications`);
            return;
        }

        navigate(-1);
    };

    const handleSaveGrade = async () => {
        const payload = buildGradePayload();

        if (!payload) {
            showToast("Error", "Debes seleccionar una escala para cada criterio antes de guardar.", 2);
            return;
        }

        setSavingGrade(true);
        try {
            const response = await gradeService.saveGrade(payload);
            if (response.data) {
                if (evaluationId && student) {
                    clearDraft(evaluationId, student.enrollment_id);
                }

                showToast("Éxito", "La calificación se guardó correctamente.", 0);
                goBackToList();
                return;
            }

            showToast("Error", response.error || "No se pudo guardar la calificación.", 2);
        } catch {
            showToast("Error", "Ocurrió un error al guardar la calificación.", 2);
        } finally {
            setSavingGrade(false);
        }
    };

    const handleSaveDraft = () => {
        if (!student || !evaluationId) {
            return;
        }

        setSavingDraft(true);
        try {
            saveDraft({
                evaluationId,
                enrollmentId: student.enrollment_id,
                studentCode: student.student_code,
                selectedScales,
                criterionComments,
            });

            showToast("Éxito", "Borrador guardado localmente.", 0);
            goBackToList();
        } finally {
            setSavingDraft(false);
        }
    };

    const selectedCriteriaCount = Object.keys(selectedScales).length;
    const canSaveGrade = criteria.length > 0 && selectedCriteriaCount === criteria.length && !savingGrade;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

             {/* Entity header with back button */}
            {student && (
                <EntityHeader
                    onBack={goBackToList}
                    backLabel="← Volver"
                    title={student.student_code}
                    description={student.email}
                    entityType="Estudiante"
                >
                    {evaluation && (
                        <div className="space-y-1 text-sm text-body dark:text-bodydark">
                            <p>{evaluation.name ?? evaluation.id}</p>
                            {getSubtitle() && <p>{getSubtitle()}</p>}
                        </div>
                    )}
                </EntityHeader>
            )}

            {/* Page header */}
            <PageHeader
                title="Calificar estudiante"
                description="Completa cada criterio seleccionando una escala y, si lo necesitas, añade comentarios opcionales antes de guardar o continuar más tarde."
            />

            <div className="space-y-6">
                {loading ? (
                    <p className="text-sm text-body dark:text-bodydark">Cargando información de la calificación…</p>
                ) : !evaluation || !student ? (
                    <p className="text-sm text-body dark:text-bodydark">No se encontró la información necesaria para calificar.</p>
                ) : criteria.length === 0 ? (
                    <p className="text-sm text-body dark:text-bodydark">No hay criterios disponibles para esta rúbrica.</p>
                ) : (
                    criteria.map((criterion) => (
                        <section key={criterion.id} className="space-y-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
                            {/* Criterion header with comment toggle */}
                            <PageHeader
                                title={criterion.name ?? "Criterio"}
                                description={criterion.description || "Sin descripción"}
                                primaryAction={{
                                    label: openCommentCriterionId === criterion.id ? "Ocultar comentario" : "Agregar comentario opcional",
                                    onClick: () => toggleCriterionComment(criterion.id),
                                }}
                            >
                                <p className="text-xs text-body dark:text-bodydark">Peso: {criterion.weight ?? 0}%</p>
                            </PageHeader>
                            
                            {/* Seltable Table by criterion scales */}
                            {scalesByCriterion[criterion.id]?.length ? (
                                <SelectableTable
                                    data={scalesByCriterion[criterion.id]}
                                    columns={SCALE_COLUMNS}
                                    actions={[]}
                                    onAction={(actionName, item) => {
                                        if (actionName === "select") {
                                            handleScaleSelect(criterion.id, item.id);
                                        }
                                    }}
                                    selectionMode={1}
                                    selectionName={`criterion-${criterion.id}`}
                                    selectedItemId={selectedScales[criterion.id]}
                                />
                            ) : (
                                <p className="text-sm text-body dark:text-bodydark">Cargando escalas…</p>
                            )}

                            {/* Criterion comment box */}
                            <CriterionCommentBox
                                isOpen={openCommentCriterionId === criterion.id}
                                comment={criterionComments[criterion.id] ?? ""}
                                onChange={(value) => handleCommentChange(criterion.id, value)}
                            />
                        </section>
                    ))
                )}

                {evaluation && student && criteria.length > 0 && (
                    <div className="flex items-center justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                        <button
                            type="button"
                            onClick={goBackToList}
                            className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                        >
                            Cerrar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={savingDraft}
                            className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {savingDraft ? "Guardando…" : "Guardar como borrador"}
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleSaveGrade()}
                            disabled={!canSaveGrade}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {savingGrade ? "Guardando…" : "Guardar calificación"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalificationDetailPage;