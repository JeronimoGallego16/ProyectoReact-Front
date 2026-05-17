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
import { useNavigate } from "react-router";
import { useEntityCrud } from "../../hooks/useEntityCrud";

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

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Helper functions for VerticalTextFormCard ──────────────────────────────

    const getFormFields = (f: Omit<Evaluation, "id">): VerticalTextFormField[] => {
        return [
            {
                name: "name",
                label: "Nombre",
                placeholder: "Ingrese el nombre de la evaluación",
                type: "text",
                value: f.name,
            },
            {
                name: "description",
                label: "Descripción",
                placeholder: "Ingrese la descripción de la evaluación",
                kind: "textarea",
                rows: 3,
                value: f.description,
            },
            {
                name: "weight",
                label: "Peso",
                placeholder: "Ingrese el peso de la evaluación (0-100)",
                type: "number",
                value: String(f.weight),
            },
            {
                name: "group_id",
                label: "Grupo",
                kind: "select",
                value: f.group_id,
                options: groups.map((group) => ({
                    label: `${group.name} - ${group.group_code} (${subjects.find((subject) => subject.id === group.subject_id)?.name ?? group.subject_id})`,
                    value: group.id,
                })),
            },
        ];
    };

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

    // ── useEntityCrud hook ────────────────────────────────────────────────────

    const {
        isOpen: isCrudModalOpen,
        close: closeCrudModal,
        handleAction,
        handleSave,
        startCreate,
        title: formTitle,
        description: formDescription,
        fields: formFields,
        saveLabel,
    } = useEntityCrud<Evaluation>({
        emptyForm: emptyForm(),
        loadData,
        createItem: async (payload) => {
            const response = await evaluationService.createEvaluation(payload);
            return response.data ?? null;
        },
        updateItem: async (id, payload) => {
            const response = await evaluationService.updateEvaluation(id, payload);
            return response.data ?? null;
        },
        deleteOrArchive: async (id) => {
            const result = await evaluationService.deleteEvaluation(id);
            return result.success === true;
        },
        buildFields: (f) => getFormFields(f),
        mapSaveValues: (values, f) => {
            const selectedGroup = groups.find((group) => group.id === values.group_id);
            return {
                ...f,
                name: values.name ?? f.name,
                description: values.description ?? f.description,
                weight: Number(values.weight) || 0,
                subject_id: selectedGroup?.subject_id ?? f.subject_id,
                group_id: selectedGroup?.id ?? f.group_id,
            };
        },
        validateSave: (values) => {
            if (!groups.find((group) => group.id === values.group_id)) {
                return "Debes seleccionar un grupo válido para crear la evaluación.";
            }
            return null;
        },
        getFormTitle: (mode) => {
            if (mode === "create") return "Crear Evaluación";
            if (mode === "edit") return "Editar Evaluación";
            return "";
        },
        getFormDescription: (mode, item) => {
            if (item && mode === "edit") {
                return `Nombre: ${item.name ?? "—"} - Peso: ${item.weight ?? "—"}`;
            }
            return "";
        },
        getConfirmMessage: (type, item) => {
            if (type === "delete") {
                return `¿Eliminar la evaluación "${item.name ?? item.id}"? Esta acción no se puede deshacer.`;
            }
            return "";
        },
        successMessages: {
            create: "Evaluación creada exitosamente.",
            update: "Evaluación actualizada exitosamente.",
            delete: "Evaluación eliminada exitosamente.",
        },
        errorMessages: {
            create: "No se pudo crear la evaluación.",
            update: "No se pudo actualizar la evaluación.",
            delete: "No se pudo eliminar la evaluación.",
        },
        onAction: async (actionName, item) => {
            if (actionName === "view") {
                navigate(`/evaluations/${item.id}/rubric`);
            } else if (actionName === "grade") {
                navigate(`/evaluations/${item.id}/califications`);
            }
        },
    });

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
                    onClick: startCreate,
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
            {editable && isCrudModalOpen && (
                <ModalLauncher
                    isOpen={isCrudModalOpen}
                    onClose={closeCrudModal}
                >
                    {() => (
                        <VerticalTextFormCard
                            title={formTitle}
                            description={formDescription}
                            fields={formFields}
                            saveLabel={saveLabel}
                            cancelLabel="Cancelar"
                            onSave={handleSave}
                            onCancel={closeCrudModal}
                        />
                    )}
                </ModalLauncher>
            )}

        </div>
    );
};

export default EvaluationsPage;
