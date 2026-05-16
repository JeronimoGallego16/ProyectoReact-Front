import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GenericTable from "../../components/GenericTable";
import PageHeader from "../../components/PageHeader";
import CriterionCommentBox from "../../components/CriterionCommentBox";
import { gradeService } from "../../services/GradeService";
import { enrollmentService } from "../../services/EnrollmentService";
import studentService from "../../services/student.service";
import { Grade } from "../../models/Grade";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user"; 
import { showToast } from "../../hooks/fireToast";

// ─── Types ────────────────────────────────────────────────────────────────────

const COLUMNS = ["final_score", "student_code", "observations", "is_locked"];

const TEACHER_ACTIONS = (_grade: Grade) => [
    { name: "view", label: "Ver" },
    { name: "observations", label: "Observaciones" },
];

const STUDENT_ACTIONS = [
    { name: "view", label: "Ver" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

// ─── Component ────────────────────────────────────────────────────────────────

const GradesPage: React.FC = () => {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [students, setStudents] = useState<{ student_code: string; email: string; enrollment_id: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadGrades = async () => {
        setLoading(true);
        const resp = await gradeService.getGrades();

        // Resp puede ser:
        // - Un array (backend devuelve payload crudo)
        // - Un ApiResponse { success, data }
        // Aceptamos ambos formatos sin cambiar el cliente global.
        let data: Grade[] = [];
        if (Array.isArray(resp)) {
            data = resp as Grade[];
        } else if (resp && Array.isArray((resp as any).data)) {
            data = (resp as any).data as Grade[];
        } else if (resp && (resp as any).success === false) {
            showToast('Error', (resp as any).error ?? 'No se pudo cargar las notas', 2);
        }
        setGrades(data);

        // Build a small lookup of enrollment_id -> student_code by fetching enrollments/students for each grade
        const rows = await Promise.all(
            data.map(async (g) => {
                try {
                    const enrollment = await enrollmentService.getEnrollmentById(g.enrollment_id);
                    if (!enrollment) return { student_code: "N/A", email: "N/A", enrollment_id: g.enrollment_id };

                    const academicStudentResp = await studentService.getAcademicStudentById(enrollment.student_id);
                    const academicStudent = (academicStudentResp?.data ?? {}) as any;

                    const userResp = academicStudent?.user_id
                        ? await studentService.getStudentById(academicStudent.user_id)
                        : null;
                    const student = (userResp as any)?.data ?? userResp;

                    return {
                        student_code: student?.code ?? academicStudent?.identification ?? "N/A",
                        email: student?.email ?? "N/A",
                        enrollment_id: enrollment.id,
                    };
                } catch (e) {
                    return { student_code: "N/A", email: "N/A", enrollment_id: g.enrollment_id };
                }
            })
        );

        setStudents(rows);
        setLoading(false);
    };

    useEffect(() => {
        loadGrades();
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const grade = item as Grade;

        if (actionName === "view") {
            navigate(`/grades/${grade.id}`);
            return;
        }

        if (actionName === "observations") {
            setObsGrade(grade);
            setObsValue(grade.observations ?? "");
            setObsModalOpen(true);
        }
    };

    const handlePublishAll = async () => {
        const unlockedGrades = grades.filter((grade) => !grade.is_locked);

        if (unlockedGrades.length === 0) {
            showToast("Info", "No hay notas pendientes para publicar.", 1);
            return;
        }

        const ok = window.confirm(
            `¿Publicar ${unlockedGrades.length} nota(s)? Todas quedarán bloqueadas y no podrán modificarse.`
        );
        if (!ok) return;

        let publishedCount = 0;
        const failedGrades: Grade[] = [];

        for (const grade of unlockedGrades) {
            const response = await gradeService.updateGrade(grade.id, { is_locked: true });
            if (response.data) {
                publishedCount += 1;
            } else {
                failedGrades.push(grade);
            }
        }

        if (failedGrades.length === 0) {
            showToast("Éxito", `${publishedCount} nota(s) publicadas y bloqueadas exitosamente.`, 0);
        } else if (publishedCount > 0) {
            showToast(
                "Error",
                `Se publicaron ${publishedCount} nota(s), pero ${failedGrades.length} no pudieron bloquearse.`,
                2
            );
        } else {
            showToast("Error", "No se pudieron publicar las notas.", 2);
        }

        await loadGrades();
    };



    // ── Table data ────────────────────────────────────────────────────────────

    // Observations state
    const [obsModalOpen, setObsModalOpen] = useState(false);
    const [obsGrade, setObsGrade] = useState<Grade | null>(null);
    const [obsValue, setObsValue] = useState<string>("");
    const [savingObs, setSavingObs] = useState(false);

    const saveObservations = async () => {
        if (!obsGrade) return;
        setSavingObs(true);
        try {
            const resp = await gradeService.updateGrade(obsGrade.id, { observations: obsValue });
            if (resp && (resp as any).data) {
                showToast("Éxito", "Observaciones guardadas.", 0);
                setGrades((prev) => prev.map((g) => (g.id === obsGrade.id ? { ...g, observations: obsValue } : g)));
                setObsGrade(null);
                setObsModalOpen(false);
                return;
            }

            setObsModalOpen(false);
            setObsGrade(null);
            showToast("Error", (resp as any).error || "No se pudieron guardar las observaciones.", 2);
        } catch (e) {
            setObsModalOpen(false);
            setObsGrade(null);
            showToast("Error", "Ocurrió un error al guardar las observaciones.", 2);
        } finally {
            setSavingObs(false);
        }
    };


    const tableData = grades.map((g) => ({
        ...g,
        student_code: students.find((s) => s.enrollment_id === g.enrollment_id)?.student_code ?? "",
        observations: g.observations ? g.observations : "-",
        is_locked: g.is_locked ? "Bloqueada" : "Editable",
    }));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Page header */}
            <PageHeader
                title="Notas"
                description={editable
                    ? "Gestiona y publica las notas de los estudiantes."
                    : "Consulta tus notas."}
            />

            {/* Table */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando notas…</p>
                    ) : grades.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron notas.</p>
                    ) : (
                        <GenericTable
                            data={tableData}
                            columns={COLUMNS}
                            actions={editable ? TEACHER_ACTIONS(grades[0]) : STUDENT_ACTIONS}
                            onAction={(actionName, item) => {
                                const grade = grades.find((g) => g.id === (item as Grade).id);
                                if (!grade) return;
                                if (actionName === "view") {
                                    handleAction("view", grade);
                                    return;
                                }
                                if (actionName === "observations") {
                                    handleAction("observations", grade);
                                }
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Publish button — publishes all unlocked grades at once */}
            {obsModalOpen && (
                <div className="p-4">
                    <CriterionCommentBox
                        isOpen={true}
                        comment={obsValue}
                        onChange={(v) => setObsValue(v)}
                        onAccept={() => void saveObservations()}
                        onCancel={() => { setObsModalOpen(false); setObsGrade(null); }}
                        acceptLabel={savingObs ? "Guardando…" : "Guardar"}
                    />
                </div>
            )}

            {editable && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        onClick={() => void handlePublishAll()}
                        disabled={!grades.some((g) => !g.is_locked)}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Publicar todas las notas pendientes
                    </button>
                </div>
            )}

        </div>
    );
};

export default GradesPage;