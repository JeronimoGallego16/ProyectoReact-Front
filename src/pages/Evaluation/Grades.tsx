import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import FilterTable from "../../components/FilterTable";
import GenericTable from "../../components/GenericTable";
import PageHeader from "../../components/PageHeader";
import CriterionCommentBox from "../../components/CriterionCommentBox";
import { showToast } from "../../hooks/fireToast";
import { useSwalConfirm } from '../../hooks/useSwalConfirm';

import { gradeService } from "../../services/GradeService";
import { enrollmentService } from "../../services/EnrollmentService";
import { groupService } from "../../services/GroupService";
import securityService from "../../services/segurity.service";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { evaluationAuthorizationService } from "../../utils/EvalationAuthorizationService";
import { resolveStudentInfoByAcademicStudentId } from "../../utils/dataResolvers";

import { exportGroupGradesPDF } from "../../utils/pdfExporter";

import { Grade } from "../../models/Grade";
import { Group } from "../../models/Group";
import { UserRole } from "../../models/user"; 

// ─── Types ────────────────────────────────────────────────────────────────────
const COLUMNS = ["final_score", "student_code", "observations", "is_locked"];

const TEACHER_ACTIONS = () => [
    { name: "view", label: "Ver Detalles" },
    { name: "observations", label: "Observaciones" },
];

const STUDENT_ACTIONS = [
    { name: "view", label: "Ver Detalles" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

const getActionsForRole = (role: UserRole) => (canEdit(role) ? TEACHER_ACTIONS() : STUDENT_ACTIONS);


// ─── Component ────────────────────────────────────────────────────────────────
const GradesPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState<Record<string, any>[]>([]);
    const navigate = useNavigate();

    // grades list is reflected in `tableData` so we don't keep a separate read-only copy
    const [groups, setGroups] = useState<Group[]>([]);
    const [accessibleGroupIds, setAccessibleGroupIds] = useState<string[]>([]);
    const [groupFilterId, setGroupFilterId] = useState("");
    const [lockedFilter, setLockedFilter] = useState("");
    const [studentCodeFilter, setStudentCodeFilter] = useState("");

    // Observations state
    const [obsModalOpen, setObsModalOpen] = useState(false);
    const [obsGrade, setObsGrade] = useState<Grade | null>(null);
    const [obsValue, setObsValue] = useState<string>("");
    const [savingObs, setSavingObs] = useState(false);

    const reduxUser = useSelector((state: RootState) => state.user.user);
    const currentUser = reduxUser ?? securityService.getUser();
    const role: UserRole = currentUser?.role ?? "STUDENT";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────
    const loadGrades = async () => {
        setLoading(true);
        try {
            const resp = await gradeService.getGrades();

            if (!resp.success) {
                showToast("Error", resp.error ?? "No se pudo cargar las notas", 2);
            }

            const data: Grade[] = Array.isArray(resp.data) ? resp.data : [];

            const filteredGrades = await evaluationAuthorizationService.filterGradesByUser(currentUser, data);

            const [allGroups, accessibleGroups] = await Promise.all([
                groupService.getGroups(),
                evaluationAuthorizationService.getAccessibleGroupIds(currentUser),
            ]);

            setGroups(Array.isArray(allGroups) ? allGroups : []);
            setAccessibleGroupIds(Array.isArray(accessibleGroups) ? accessibleGroups : []);

            const nextTableData = await Promise.all(
                filteredGrades.map(async (grade) => {
                    const studentDetailId = grade.details?.[0]?.student_id;
                    const studentInfo = await resolveStudentInfoByAcademicStudentId(studentDetailId);
                    const studentCode = studentInfo.student_code ?? "-";
                    const enrollment = await enrollmentService.getEnrollmentById(grade.enrollment_id);
                    const groupId = enrollment?.group_id ?? "";

                    return {
                        ...grade,
                        student_code: studentCode,
                        group_id: groupId,
                        observations: grade.observations ? grade.observations : "-",
                                is_locked: grade.is_locked ? "Bloqueada" : "No publicada",
                                is_locked_bool: !!grade.is_locked,
                    };
                })
            );
            setTableData(nextTableData);
        } finally {
            setLoading(false);
        }
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

        // NOTE: unlocking is prevented by backend; UI action removed.
    };

    const groupsForFilter = role === "ADMIN"
        ? groups
        : groups.filter((group) => accessibleGroupIds.includes(group.id));

    const filteredTableData = tableData.filter((grade) => {
        if (groupFilterId && grade.group_id !== groupFilterId) return false;
        if (lockedFilter) {
            if (lockedFilter === "locked" && !grade.is_locked_bool) return false;
            if (lockedFilter === "unlocked" && grade.is_locked_bool) return false;
        }
        if (studentCodeFilter) {
            const code = (grade.student_code ?? "").toString().toLowerCase();
            if (!code.includes(studentCodeFilter.toLowerCase())) return false;
        }
        return true;
    });

    const { showConfirm } = useSwalConfirm();

    const handlePublishAll = async () => {
        // Publish only unlocked grades, optionally filtered by selected group
        const unlockedGrades = tableData.filter((row) => !row.is_locked_bool && (!groupFilterId || row.group_id === groupFilterId));

        if (unlockedGrades.length === 0) {
            showToast("Info", "No hay notas pendientes para publicar.", 1);
            return;
        }

        const ok = await showConfirm(
            `¿Publicar ${unlockedGrades.length} nota(s)? Todas quedarán bloqueadas y no podrán modificarse.`,
            { title: 'Confirmar publicación' }
        );
        if (!ok) return;

        let publishedCount = 0;
        const failedGrades: Record<string, any>[] = [];

        const failedErrors: string[] = [];
        for (const gradeRow of unlockedGrades) {
            const response = await gradeService.updateGrade(gradeRow.id, { is_locked: true });
            if (response && (response as any).success === true) {
                publishedCount += 1;
            } else {
                failedGrades.push(gradeRow);
                if (response && (response as any).error) failedErrors.push((response as any).error);
            }
        }

        if (failedGrades.length === 0) {
            showToast("Éxito", `${publishedCount} nota(s) publicadas y bloqueadas exitosamente.`, 0);
        } else {
            const uniqueErrors = Array.from(new Set(failedErrors.filter(Boolean))).slice(0, 3);
            const errorSuffix = uniqueErrors.length ? ` Errores: ${uniqueErrors.join("; ")}` : "";
            if (publishedCount > 0) {
                showToast(
                    "Error",
                    `Se publicaron ${publishedCount} nota(s), pero ${failedGrades.length} no pudieron bloquearse.${errorSuffix}`,
                    2
                );
            } else {
                showToast("Error", `No se pudieron publicar las notas.${errorSuffix}`.trim(), 2);
            }
        }

        await loadGrades();
    };

     // Export pdf with the grades from the table ─────────────
    const handleExportPDF = () => {
        if (filteredTableData.length === 0) {
            showToast("Info", "No hay notas para exportar.", 1);
            return;
        }
        exportGroupGradesPDF("Grupo", COLUMNS, filteredTableData);
    };

    const saveObservations = async () => {
        if (!obsGrade) return;
        setSavingObs(true);

        try {
            const resp = await gradeService.updateGrade(obsGrade.id, { observations: obsValue });
                if (resp && (resp as any).data) {
                showToast("Éxito", "Observaciones guardadas.", 0);
                    setTableData((prev) => prev.map((row) => (row.id === obsGrade.id ? { ...row, observations: obsValue || "-" } : row)));
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

    // ── Table data ────────────────────────────────────────────────────────────
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

            <FilterTable
                filters={[
                    {
                        id: "group_id",
                        label: "Grupo",
                        placeholder: "Todos los grupos",
                        type: "select",
                        options: groupsForFilter.map((group) => ({
                            label: `${group.name} - ${group.group_code}`,
                            value: group.id,
                        })),
                    },
                    {
                        id: "is_locked",
                        label: "Estado",
                        placeholder: "Todos",
                        type: "select",
                        options: [
                            { value: "", label: "Todos" },
                            { value: "locked", label: "Bloqueada" },
                            { value: "unlocked", label: "No publicada" },
                        ],
                    },
                    {
                        id: "student_code",
                        label: "Código estudiante",
                        placeholder: "Buscar por código",
                        type: "text",
                    },
                ]}
                onFilterChange={(filters) => {
                    setGroupFilterId(filters.group_id ?? "");
                    setLockedFilter(filters.is_locked ?? "");
                    setStudentCodeFilter(filters.student_code ?? "");
                }}
            />
            {/* SweetAlert2 used for confirmations */}

            {/* Table */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando notas…</p>
                    ) : filteredTableData.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron notas.</p>
                    ) : (
                            <GenericTable
                            data={filteredTableData}
                            columns={COLUMNS}
                            actions={getActionsForRole(role)}
                            onAction={(actionName, item) => handleAction(actionName, item as Grade)}
                        />
                    )}
                </div>
            </div>

            {/* Observations box */}
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

            {/* Publish button — publishes all unlocked grades at once */}
            {editable && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        onClick={() => void handlePublishAll()}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Publicar todas las notas pendientes
                    </button>
                </div>
            )}

            {/*
                ── PDF export button ─────────────────────────────
                */}
                {editable && (
                    <button
                        onClick={handleExportPDF}
                        disabled={loading || filteredTableData.length === 0}
                        className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                        Descargar PDF
                    </button>
                )}
        </div>
    );
};

export default GradesPage;