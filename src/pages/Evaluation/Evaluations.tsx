import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import TableScroll from "../../components/TableScroll";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import ModalLauncher from "../../components/ModalLauncher";
import { evaluationService } from "../../services/EvaluationService";
import { groupService } from "../../services/GroupService";
import { subjectService } from "../../services/SubjectService";
import { Evaluation } from "../../models/Evaluation";
import { Group } from "../../models/Group";
import { Subject } from "../../models/Subject";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
import { showToast } from "../../hooks/fireToast";
import { useCrudModal } from "../../hooks/useCrudModal";
import { useNavigate } from "react-router";

// ─── Types ────────────────────────────────────────────────────────────────────

const COLUMNS = ["name", "description", "weight", "subject_id", "group_id"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "view", label: "Ver" },
    { name: "grade", label: "Calificar" },
    { name: "edit", label: "Editar" },
    { name: "delete", label: "Eliminar" },
];

const STUDENT_ACTIONS = [
    { name: "view", label: "Ver" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

const emptyForm = (): Omit<Evaluation, "id"> => ({
    name: "",
    description: "",
    weight: 0,
    subject_id: "",
    group_id: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

const EvaluationsPage: React.FC = () => {
    const navigate = useNavigate();

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);

    const {
            crudMode,
            selectedItem: selectedEvaluation,
            form,
            setForm,
            resetCrud,
            startCreate,
            startEdit,
        } = useCrudModal<Evaluation>(emptyForm());

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadData = async () => {
        setLoading(true);
        const [evaluationsResponse, subjectsData, groupsData] = await Promise.all([
            evaluationService.getEvaluations(),
            subjectService.getActiveSubjects(),
            groupService.getGroups(),
        ]);
        setEvaluations(Array.isArray(evaluationsResponse.data) ? evaluationsResponse.data : []);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setGroups(Array.isArray(groupsData) ? groupsData : []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const evaluation = item as Evaluation;

        if (actionName === "view") {
            navigate(`/evaluations/${evaluation.id}/rubric`);
            return;
        }

        if (actionName === "grade") {
            navigate(`/evaluations/${evaluation.id}/califications`);
            return;
        }

        if (actionName === "edit") {
            startEdit(evaluation);
            setIsCrudModalOpen(true);
        }

        if (actionName === "delete") {
            void handleDelete(evaluation);
        }
    };

    const handleDelete = async (evaluation: Evaluation) => {
        const ok = window.confirm(`¿Eliminar la evaluación "${evaluation.name ?? evaluation.id}"? Esta acción no se puede deshacer.`);
        if (!ok) return;

        const success = await evaluationService.deleteEvaluation(evaluation.id);
        if (success) {
            showToast("Éxito", "Evaluación eliminada exitosamente.", 0);
            await loadData();
        } else {
            showToast("Error", "No se pudo eliminar la evaluación.", 2);
        }
    };

    // ── Helper functions for VerticalTextFormCard ─────────────────────────────

    const getFormTitle = (): string => {
        if (crudMode === "create") return "Crear Evaluación";
        if (crudMode === "edit") return "Editar Evaluación";
        return "";
    };

    const getFormDescription = (): string => {
        if (selectedEvaluation && crudMode === "edit") {
            return `Nombre: ${selectedEvaluation.name ?? "—"} - Peso: ${selectedEvaluation.weight ?? "—"}`;
        }
        return "";
    };

    const getFormFields = (): VerticalTextFormField[] => {
        return [
            {
                name: "name",
                label: "Nombre",
                placeholder: "Ingrese el nombre de la evaluación",
                type: "text",
                value: form.name,
            },
            {
                name: "description",
                label: "Descripción",
                placeholder: "Ingrese la descripción de la evaluación",
                kind: "textarea",
                rows: 3,
                value: form.description,
            },
            {
                name: "weight",
                label: "Peso",
                placeholder: "Ingrese el peso de la evaluación (0-100)",
                type: "number",
                value: String(form.weight),
            },
            {
                name: "group_id",
                label: "Grupo",
                kind: "select",
                value: form.group_id,
                options: groups.map((group) => ({
                    label: `${group.name} - ${group.group_code} (${subjects.find((subject) => subject.id === group.subject_id)?.name ?? group.subject_id})`,
                    value: group.id,
                })),
            },
        ];
    };

    const getFormSaveLabel = (): string => {
        if (crudMode === "create") return "Crear";
        if (crudMode === "edit") return "Guardar Cambios";
        return "Guardar";
    };

    const handleFormSave = async (values: Record<string, string>) => {
        const selectedGroup = groups.find((group) => group.id === values.group_id);
        if (!selectedGroup) {
            showToast("Error", "Debes seleccionar un grupo válido para crear la evaluación.", 2);
            return;
        }

        const nextForm: Omit<Evaluation, "id"> = {
            ...form,
            name: values.name ?? form.name,
            description: values.description ?? form.description,
            weight: Number(values.weight) || 0,
            subject_id: selectedGroup.subject_id,
            group_id: selectedGroup.id,
        };

        setForm(nextForm);

        if (crudMode === "create") {
            const created = await evaluationService.createEvaluation(nextForm);
            if (created) {
                showToast("Éxito", "Evaluación creada exitosamente.", 0);
                setIsCrudModalOpen(false);
                resetCrud();
                await loadData();
            } else {
                showToast("Error", "No se pudo crear la evaluación.", 2);
            }
            return;
        }

        if (crudMode === "edit" && selectedEvaluation) {
            const updated = await evaluationService.updateEvaluation(selectedEvaluation.id, nextForm);
            if (updated) {
                showToast("Éxito", "Evaluación actualizada exitosamente.", 0);
                setIsCrudModalOpen(false);
                resetCrud();
                await loadData();
            } else {
                showToast("Error", "No se pudo actualizar la evaluación.", 2);
            }
        }
    };

    // ── Table data ────────────────────────────────────────────────────────────

    const tableData = evaluations.map((e) => ({
        ...e,
        subject_id: subjects.find((s) => s.id === e.subject_id)?.name ?? e.subject_id ?? "—",
        group_id: groups.find((g) => g.id === e.group_id)?.group_code ?? e.group_id ?? "—",
    }));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Page header */}
            <PageHeader
                title="Evaluaciones"
                description={editable
                    ? "Gestiona tus evaluaciones: crea, edita y elimina."
                    : "Busca y navega por las evaluaciones disponibles."}
                primaryAction={editable ? {
                    label: "+ Nueva Evaluación",
                    onClick: () => {
                        startCreate();
                        setIsCrudModalOpen(true);
                    },
                } : undefined}
            />

            {/* Table — full height */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando evaluaciones…</p>
                    ) : evaluations.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron evaluaciones.</p>
                    ) : (
                        <TableScroll maxHeight="55vh">
                            <GenericTable
                                data={tableData}
                                columns={COLUMNS}
                                actions={editable ? ADMIN_TEACHER_ACTIONS : STUDENT_ACTIONS}
                                onAction={handleAction}
                            />
                        </TableScroll>
                    )}
                </div>
            </div>

            {/* CRUD modal using ModalLauncher */}
            {editable && crudMode && (
                <ModalLauncher
                    isOpen={isCrudModalOpen}
                    onClose={() => {
                        setIsCrudModalOpen(false);
                        resetCrud();
                    }}
                >
                    {() => (
                        <VerticalTextFormCard
                            title={getFormTitle()}
                            description={getFormDescription()}
                            fields={getFormFields()}
                            saveLabel={getFormSaveLabel()}
                            cancelLabel="Cancelar"
                            onSave={handleFormSave}
                            onCancel={() => {
                                setIsCrudModalOpen(false);
                                resetCrud();
                            }}
                        />
                    )}
                </ModalLauncher>
            )}

        </div>
    );
};

export default EvaluationsPage;
