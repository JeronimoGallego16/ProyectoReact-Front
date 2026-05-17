import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GenericTable from "../../components/GenericTable";
import EntityHeader from "../../components/EntityHeader";
import PageHeader from "../../components/PageHeader";
import TableScroll from "../../components/TableScroll";
import { showToast } from "../../hooks/fireToast";
import useCalificationDraft from "../../hooks/useCalificationDraft";

import { Evaluation } from "../../models/Evaluation";
import { Group } from "../../models/Group";
import { Subject } from "../../models/Subject";
import { Enrollment } from "../../models/Enrollment";

import { evaluationService } from "../../services/EvaluationService";
import { enrollmentService } from "../../services/EnrollmentService";
import { groupService } from "../../services/GroupService";
import { subjectService } from "../../services/SubjectService";

import { resolveStudentInfo } from "../../utils/dataResolvers";
import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";

// ─── Types ────────────────────────────────────────────────────────────────────
type StudentRow = {
    id: string;
    student_code: string;
    email: string;
    enrollment_id: string;
    hasDraft: boolean;
};

const STUDENT_COLUMNS = ["student_code", "email"];

// ─── Component ────────────────────────────────────────────────────────────────
const CalificationPage: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId: string }>();
    const navigate = useNavigate();
    const { hasDraft } = useCalificationDraft();

    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [group, setGroup] = useState<Group | null>(null);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const user = securityService.getUser();
    const role: UserRole = user?.role ?? "STUDENT";
    const editable = role === "ADMIN" || role === "TEACHER";

    const loadData = async () => {
        if (!evaluationId) return;

        setLoading(true);

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

            const groupId = groupResp?.id ?? evaluationData?.group_id;
            if (groupId) {
                const enrollments = await enrollmentService.getEnrollmentsByGroup(groupId);
                const activeEnrollments = enrollments.filter((enrollment: Enrollment) => enrollment.status === "ACTIVE");

                const rows = await Promise.all(
                    activeEnrollments.map(async (enrollment) => {
                        const info = await resolveStudentInfo(enrollment);

                        return {
                            id: enrollment.id,
                            student_code: info.student_code,
                            email: info.email,
                            enrollment_id: enrollment.id,
                            hasDraft: evaluationData?.id ? hasDraft(evaluationData.id, enrollment.id) : false,
                        };
                    })
                );

                setStudents(rows);
            } else {
                setStudents([]);
            }
        } catch {
            showToast("Error", "No se pudo cargar la información de la evaluación.", 2);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [evaluationId]);

    // ── Handlers ─────────────────────────────────────────────────────────
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

    const goToGradeDetail = (student: StudentRow, useDraft = false) => {
        if (!evaluationId) return;

        const basePath = `/evaluations/${evaluationId}/califications/${student.enrollment_id}`;
        navigate(useDraft ? `${basePath}?draft=1` : basePath);
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {evaluation && (
                <EntityHeader
                    onBack={() => navigate('/evaluations')}
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
                description="Selecciona un estudiante para abrir la pantalla de calificación."
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
                                data={students.map((s) => ({ id: s.id, student_code: s.student_code, email: s.email }))}
                                columns={STUDENT_COLUMNS}
                                actions={editable ? [{ name: "grade", label: "Calificar" }] : []}
                                onAction={(actionName, item) => {
                                    const row = item as StudentRow;
                                    if (actionName === "grade") goToGradeDetail(row, false);
                                }}
                            />
                        </TableScroll>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalificationPage;