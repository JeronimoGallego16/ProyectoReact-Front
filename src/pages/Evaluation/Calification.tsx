import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GenericTable from "../../components/GenericTable";
import SelectableTable from "../../components/SelectableTable";
import TableScroll from "../../components/TableScroll";
import PageHeader from "../../components/PageHeader";
import EntityHeader from "../../components/EntityHeader";
import ModalLauncher from "../../components/ModalLauncher";
import { evaluationService } from "../../services/EvaluationService";
import { gradeService } from "../../services/GradeService";
import { enrollmentService } from "../../services/EnrollmentService";
import { rubricService } from "../../services/RubricService";
import { Evaluation } from "../../models/Evaluation";
import { Criterion } from "../../models/Criterion";
import { Scale } from "../../models/Scale";
import { GradeDetail } from "../../models/GradeDetail";
import { UserRole } from "../../models/user";
import { showToast } from "../../hooks/fireToast";

// ─── Types ────────────────────────────────────────────────────────────────────

const STUDENT_COLUMNS = ["id", "name", "email"];

const SCALE_COLUMNS = ["name", "description", "value"];

const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

const CalificationPage: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId: string }>();
    const navigate = useNavigate();

    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [scalesByCriterion, setScalesByCriterion] = useState<Record<string, Scale[]>>({});
    const [existingGrades, setExistingGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradingStudent, setGradingStudent] = useState<any | null>(null);
    const [selectedScales, setSelectedScales] = useState<Record<string, string>>({});

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadData = async () => {
        if (!evaluationId) return;
        setLoading(true);
        try {
            const evaluationResp = await evaluationService.getEvaluationById(evaluationId);
            setEvaluation(evaluationResp.data || null);

            if (evaluationResp.data?.group_id) {
                const enrollmentsResp = await enrollmentService.getEnrollmentsByGroup(evaluationResp.data.group_id);
                setStudents(Array.isArray(enrollmentsResp) ? enrollmentsResp : []);
            }

            if (evaluationResp.data?.rubric_id) {
                const criteriaResp = await rubricService.getCriteriaByRubricId(evaluationResp.data.rubric_id);
                const critArray = Array.isArray(criteriaResp.data) ? criteriaResp.data : [];
                setCriteria(critArray);

                // Load scales for each criterion
                const scalesMap: Record<string, Scale[]> = {};
                for (const criterion of critArray) {
                    const scalesResp = await rubricService.getScaleByCriterionId(criterion.id);
                    scalesMap[criterion.id] = Array.isArray(scalesResp.data) ? scalesResp.data : [];
                }
                setScalesByCriterion(scalesMap);

                // Load existing grades for this rubric
                const gradesResp = await gradeService.getGradesByRubricId(evaluationResp.data.rubric_id);
                setExistingGrades(Array.isArray(gradesResp.data) ? gradesResp.data : []);
            }
        } catch (err) {
            showToast("Error", "No se pudieron cargar los datos de calificación.", 2);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [evaluationId]);

    // ── Grade submission ──────────────────────────────────────────────────────

    const handleGradeStudent = (student: any) => {
        setGradingStudent(student);
        setSelectedScales({});
    };

    const handleSubmitGrades = async () => {
        if (!gradingStudent || !evaluation || !evaluation.rubric_id) {
            showToast("Error", "Faltan datos para guardar la calificación.", 2);
            return;
        }

        setLoading(true);
        try {
            const details = Object.entries(selectedScales).map(([_criterionId, scaleId]) => ({
                scale_id: scaleId,
            }));

            const payload = {
                enrollment_id: gradingStudent.id,
                rubric_id: evaluation.rubric_id,
                details,
                status: "SENT",
            };

            const response = await gradeService.saveGrade(payload);
            if (response.data) {
                showToast("Éxito", "Estudiante calificado exitosamente.", 0);
                setGradingStudent(null);
                setSelectedScales({});
                await loadData();
            } else {
                showToast("Error", response.error || "No se pudo guardar la calificación.", 2);
            }
        } catch (err) {
            showToast("Error", "Error al guardar la calificación.", 2);
        } finally {
            setLoading(false);
        }
    };

    const handleScaleSelect = (criterionId: string, scaleId: string) => {
        setSelectedScales((prev) => ({
            ...prev,
            [criterionId]: scaleId,
        }));
    };

    // ── Helpers ──────────────────────────────────────────────────────────────

    const isStudentGraded = (studentId: string): boolean => {
        // Check if student has grades by looking in the details array
        return existingGrades.some((grade) =>
            grade.details?.some((detail: GradeDetail) => detail.student_id === studentId)
        );
    };

    // ── Student actions ──────────────────────────────────────────────────────

    const handleStudentAction = (actionName: string, item: Record<string, any>) => {
        if (actionName === "grade") {
            if (!evaluation?.rubric_id || criteria.length === 0) {
                showToast("Error", "No hay rúbrica asociada a esta evaluación para calificar.", 2);
                return;
            }
            if (isStudentGraded(item.student_id)) {
                showToast("Info", "Este estudiante ya está calificado.", 1);
                return;
            }
            handleGradeStudent(item);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {/* Entity header */}
            {evaluation && (
                <EntityHeader
                    onBack={() => navigate(-1)}
                    backLabel="← Volver"
                    title={evaluation.name ?? evaluation.id}
                    description={evaluation.description}
                    entityType="Calificar Evaluación"
                >
                    {evaluation.weight !== undefined && (
                        <p className="text-sm text-body dark:text-bodydark">Peso: {evaluation.weight}</p>
                    )}
                </EntityHeader>
            )}

            {/* Page header */}
            <PageHeader
                title="Calificación"
                description="Selecciona un estudiante para calificarlo según la rúbrica asociada."
            />

            {/* Students table */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando estudiantes…</p>
                    ) : students.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron estudiantes en este grupo.</p>
                    ) : (
                        <TableScroll maxHeight="55vh">
                            <GenericTable
                                data={students.map((s) => ({
                                    id: s.id,
                                    student_id: s.student_id,
                                    name: s.student?.name ?? s.student_id ?? "—",
                                    email: s.student?.email ?? "—",
                                }))}
                                columns={STUDENT_COLUMNS}
                                actions={editable ? [{ name: "grade", label: "Calificar" }] : []}
                                onAction={handleStudentAction}
                            />
                        </TableScroll>
                    )}
                </div>
            </div>

            {/* Grading modal */}
            {editable && gradingStudent && (
                <ModalLauncher isOpen={!!gradingStudent} onClose={() => setGradingStudent(null)}>
                    {() => (
                        <div>
                            <div className="mb-6 border-b border-stroke pb-4 dark:border-strokedark">
                                <h3 className="text-lg font-semibold text-black dark:text-white">
                                    Calificar: {gradingStudent.name}
                                </h3>
                                <p className="mt-1 text-sm text-body dark:text-bodydark">
                                    Selecciona una escala para cada criterio.
                                </p>
                            </div>

                            <TableScroll maxHeight="60vh">
                                <div className="space-y-6">
                                    {criteria.length === 0 ? (
                                        <p className="text-sm text-body dark:text-bodydark">
                                            No hay criterios disponibles para esta rúbrica.
                                        </p>
                                    ) : (
                                        criteria.map((criterion) => (
                                            <div key={criterion.id} className="space-y-2">
                                                <h4 className="text-sm font-medium text-black dark:text-white">
                                                    {criterion.name} (Peso: {criterion.weight}%)
                                                </h4>
                                                {scalesByCriterion[criterion.id] ? (
                                                    <SelectableTable
                                                        data={scalesByCriterion[criterion.id]}
                                                        columns={SCALE_COLUMNS}
                                                        actions={[]}
                                                        onAction={(action, item) => {
                                                            if (action === "select") {
                                                                handleScaleSelect(criterion.id, (item as Scale).id);
                                                            }
                                                        }}
                                                        selectionMode={1}
                                                    />
                                                ) : (
                                                    <p className="text-xs text-body dark:text-bodydark">Cargando escalas…</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TableScroll>

                            <div className="mt-6 flex gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                                <button
                                    type="button"
                                    onClick={() => setGradingStudent(null)}
                                    className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleSubmitGrades()}
                                    disabled={Object.keys(selectedScales).length !== criteria.length || loading}
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Guardando…" : "Guardar Calificación"}
                                </button>
                            </div>
                        </div>
                    )}
                </ModalLauncher>
            )}
        </div>
    );
};

export default CalificationPage;
