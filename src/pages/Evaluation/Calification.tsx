import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GenericTable from "../../components/GenericTable";
import CriterionCommentBox from "../../components/CriterionCommentBox";
import EntityHeader from "../../components/EntityHeader";
import ModalLauncher from "../../components/ModalLauncher";
import PageHeader from "../../components/PageHeader";
import SelectableTable from "../../components/SelectableTable";

import { Evaluation } from "../../models/Evaluation";
import { Criterion } from "../../models/Criterion";
import { Group } from "../../models/Group";
import { Scale } from "../../models/Scale";
import { Subject } from "../../models/Subject";
import { Enrollment } from "../../models/Enrollment";

import { evaluationService } from "../../services/EvaluationService";
import { enrollmentService } from "../../services/EnrollmentService";
import { groupService } from "../../services/GroupService";
import { gradeService } from "../../services/GradeService";
import studentService from "../../services/student.service";
import { subjectService } from "../../services/SubjectService";
import { rubricService } from "../../services/RubricService";
import { criterionService } from "../../services/CriterionService";
import { scaleService } from "../../services/ScaleService";

import { showToast } from "../../hooks/fireToast";

type StudentRow = {
    student_code: string;
    email: string;
    enrollment_id: string;
};

const STUDENT_COLUMNS = ["student_code", "email"];

const CalificationPage: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId: string }>();
    const navigate = useNavigate();

    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [rubric, setRubric] = useState<{ id: string; title?: string } | null>(null);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [scalesByCriterion, setScalesByCriterion] = useState<Record<string, Scale[]>>({});
    const [group, setGroup] = useState<Group | null>(null);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [gradingStudent, setGradingStudent] = useState<StudentRow | null>(null);
    const [selectedScales, setSelectedScales] = useState<Record<string, string>>({});
    const [criterionComments, setCriterionComments] = useState<Record<string, string>>({});
    const [openCommentCriterionId, setOpenCommentCriterionId] = useState<string | null>(null);
    const [savingGrade, setSavingGrade] = useState(false);

    const loadData = async () => {
        if (!evaluationId) return;

        setLoading(true);
        setTableLoading(true);
        try {
            const evaluationResp = await evaluationService.getEvaluationById(evaluationId);
            const evaluationData = evaluationResp.data || null;
            setEvaluation(evaluationData);

            const [groupResp, subjectResp] = await Promise.all([
                evaluationData?.group_id ? groupService.getGroupById(evaluationData.group_id) : Promise.resolve(null),
                evaluationData?.subject_id ? subjectService.getSubjectById(evaluationData.subject_id) : Promise.resolve(null),
            ]);

            setGroup(groupResp);
            setSubject(subjectResp);

            if (evaluationData?.rubric_id) {
                const [rubricResp, criteriaResp] = await Promise.all([
                    rubricService.getRubricById(evaluationData.rubric_id),
                    criterionService.getCriteriaByRubricId(evaluationData.rubric_id),
                ]);

                setRubric(rubricResp.data ? { id: rubricResp.data.id, title: rubricResp.data.title } : null);

                const rubricCriteria = Array.isArray(criteriaResp.data) ? criteriaResp.data : [];
                setCriteria(rubricCriteria);

                const scalesMapEntries = await Promise.all(
                    rubricCriteria.map(async (criterion) => {
                        const scalesResp = await scaleService.getScaleByCriterionId(criterion.id);
                        return [criterion.id, Array.isArray(scalesResp.data) ? scalesResp.data : []] as const;
                    })
                );
                setScalesByCriterion(Object.fromEntries(scalesMapEntries));
            } else {
                setRubric(null);
                setCriteria([]);
                setScalesByCriterion({});
            }

            const groupId = groupResp?.id ?? evaluationData?.group_id;
            if (groupId) {
                const enrollments = await enrollmentService.getEnrollmentsByGroup(groupId);
                const activeEnrollments = enrollments.filter((enrollment: Enrollment) => enrollment.status === "ACTIVE");

                const rows = await Promise.all(
                    activeEnrollments.map(async (enrollment) => {
                        const academicStudentResp = await studentService.getAcademicStudentById(enrollment.student_id);
                        const academicStudent = academicStudentResp.data;

                        const userResp = academicStudent?.user_id
                            ? await studentService.getStudentById(academicStudent.user_id)
                            : null;
                        const student = (userResp as any)?.data ?? userResp;

                        return {
                            student_code: student?.code ?? academicStudent?.identification ?? "N/A",
                            email: student?.email ?? "N/A",
                            enrollment_id: enrollment.id,
                        };
                    })
                );

                setStudents(rows);
            } else {
                setStudents([]);
            }
        } catch (err) {
            showToast("Error", "No se pudo cargar la información de la evaluación.", 2);
        } finally {
            setLoading(false);
            setTableLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [evaluationId]);

    const getSubtitle = (): string => {
        const pieces: string[] = [];

        if (subject) {
            pieces.push(`Asignatura: ${subject.name}`);
        } else if (evaluation?.subject_id) {
            pieces.push(`Asignatura ID: ${evaluation.subject_id}`);
        }

        if (group) {
            pieces.push(`Grupo: ${group.name}`);
        } else if (evaluation?.group_id) {
            pieces.push(`Grupo ID: ${evaluation.group_id}`);
        }

        return pieces.length > 0 ? pieces.join(" • ") : "No se pudo resolver el grupo o la asignatura asociada.";
    };

    const handleOpenGradeModal = (student: StudentRow) => {
        if (!rubric || criteria.length === 0) {
            showToast("Error", "No hay rúbrica ni criterios cargados para esta evaluación.", 2);
            return;
        }

        setGradingStudent(student);
        setSelectedScales({});
        setCriterionComments({});
        setOpenCommentCriterionId(null);
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
        if (!gradingStudent || !evaluation?.rubric_id) {
            return null;
        }

        const details = criteria.map((criterion) => {
            const scaleId = selectedScales[criterion.id];
            if (!scaleId) {
                return null;
            }

            return {
                scale_id: scaleId,
                comment: criterionComments[criterion.id]?.trim() || undefined,
            };
        });

        if (details.some((detail) => detail === null)) {
            return null;
        }

        return {
            enrollment_id: gradingStudent.enrollment_id,
            rubric_id: evaluation.rubric_id,
            details: details as Array<{ scale_id: string; comment?: string }>,
            status: "SENT",
        };
    };

    const handleSaveGrade = async (closeModal: () => void) => {
        const payload = buildGradePayload();

        if (!payload) {
            showToast("Error", "Debes seleccionar una escala para cada criterio antes de guardar.", 2);
            return;
        }

        setSavingGrade(true);
        try {
            const response = await gradeService.saveGrade(payload);
            if (response.data) {
                showToast("Éxito", "La calificación se guardó correctamente.", 0);
                setGradingStudent(null);
                setSelectedScales({});
                setCriterionComments({});
                setOpenCommentCriterionId(null);
                closeModal();
                await loadData();
                return;
            }

            // Close modal so the toast is visible
            setGradingStudent(null);
            closeModal();
            showToast("Error", response.error || "No se pudo guardar la calificación.", 2);
        } catch (error) {
            // Close modal so the toast is visible
            setGradingStudent(null);
            try { closeModal(); } catch {}
            showToast("Error", "Ocurrió un error al guardar la calificación.", 2);
        } finally {
            setSavingGrade(false);
        }
    };

    const selectedCriteriaCount = Object.keys(selectedScales).length;
    const SCALE_COLUMNS = ["name", "description", "value"];
    const canSaveGrade = criteria.length > 0 && selectedCriteriaCount === criteria.length && !savingGrade;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {evaluation && (
                <EntityHeader
                    onBack={() => navigate(-1)}
                    backLabel="← Volver"
                    title={evaluation.name ?? evaluation.id}
                    description={evaluation.description}
                    entityType="Calificación"
                >
                    <div className="space-y-1 text-sm text-body dark:text-bodydark">
                        {evaluation.weight !== undefined && <p>Peso: {evaluation.weight}</p>}
                        <p>{getSubtitle()}</p>
                    </div>
                </EntityHeader>
            )}

            <PageHeader
                title="Calificar estudiantes"
                description="Primero se muestra el contexto de la evaluación seleccionada. Después se listarán los estudiantes vinculados a la asignatura para iniciar la calificación paso a paso."
            />

            <div className="space-y-4">
                {loading ? (
                    <p className="text-sm text-body dark:text-bodydark">Cargando información de la evaluación…</p>
                ) : evaluation ? (
                    <div className="space-y-4">
                        {tableLoading ? (
                            <p className="p-6 text-sm text-body dark:text-bodydark">Cargando estudiantes…</p>
                        ) : students.length === 0 ? (
                            <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron estudiantes activos para este grupo.</p>
                        ) : (
                            <GenericTable
                                data={students}
                                columns={STUDENT_COLUMNS}
                                actions={[{ name: "grade", label: "Calificar" }]}
                                onAction={(actionName, item) => {
                                    if (actionName === "grade") {
                                        handleOpenGradeModal(item as StudentRow);
                                    }
                                }}
                            />
                        )}
                    
                    </div>
                ) : (
                    <p className="text-sm text-body dark:text-bodydark">No se encontró la evaluación solicitada.</p>
                )}

                {gradingStudent && (
                    <ModalLauncher
                        isOpen={!!gradingStudent}
                        onClose={() => setGradingStudent(null)}
                        maxWidthClassName="max-w-6xl"
                        overlayClassName="lg:pl-[18.125rem] lg:pr-6"
                    >
                        {(closeModal) => (
                            <div className="max-h-[80vh] overflow-y-auto pr-1">
                                <div className="mb-4 rounded-sm border border-stroke bg-gray-2 px-4 py-3 dark:border-strokedark dark:bg-meta-4">
                                    <p className="text-sm text-body dark:text-bodydark">
                                        Escalas seleccionadas: {selectedCriteriaCount} de {criteria.length}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {criteria.length === 0 ? (
                                        <p className="text-sm text-body dark:text-bodydark">
                                            No hay criterios disponibles para esta rúbrica.
                                        </p>
                                    ) : (
                                        criteria.map((criterion) => (
                                            <section key={criterion.id} className="space-y-4 rounded-sm border border-stroke p-4 dark:border-strokedark">
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
                                                    />
                                                ) : (
                                                    <p className="text-sm text-body dark:text-bodydark">Cargando escalas…</p>
                                                )}

                                                <CriterionCommentBox
                                                    isOpen={openCommentCriterionId === criterion.id}
                                                    comment={criterionComments[criterion.id] ?? ""}
                                                    onChange={(value) => handleCommentChange(criterion.id, value)}
                                                />
                                            </section>
                                        ))
                                    )}
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleSaveGrade(closeModal)}
                                        disabled={!canSaveGrade}
                                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingGrade ? "Guardando…" : "Guardar calificación"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </ModalLauncher>
                )}
            </div>
        </div>
    );
};

export default CalificationPage;