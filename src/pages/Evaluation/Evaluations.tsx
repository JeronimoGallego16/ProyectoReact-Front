import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import FilterTable from "../../components/FilterTable";
import GenericTable from "../../components/GenericTable";
import TableScroll from "../../components/TableScroll";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import ModalLauncher from "../../components/ModalLauncher";
import { useEntityCrud } from "../../hooks/useEntityCrud";
import { useSwalConfirm } from '../../hooks/useSwalConfirm';
import { showToast } from "../../hooks/fireToast";

import { evaluationService } from "../../services/EvaluationService";
import { groupService } from "../../services/GroupService";
import { subjectService } from "../../services/SubjectService";
import securityService from "../../services/segurity.service";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { evaluationAuthorizationService } from "../../utils/EvalationAuthorizationService";

import { Evaluation } from "../../models/Evaluation";
import { Group } from "../../models/Group";
import { Subject } from "../../models/Subject";
import { UserRole } from "../../models/user";

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
    rubric_id: "",
    subject_id: "",
    group_id: "",
});

// ─── Component ────────────────────────────────────────────────────────────────
const EvaluationsPage: React.FC = () => {
    const navigate = useNavigate();

    const { showConfirm } = useSwalConfirm();

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [accessibleGroupIds, setAccessibleGroupIds] = useState<string[]>([]);
    const [groupFilterId, setGroupFilterId] = useState("");
    const [subjectFilterId, setSubjectFilterId] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [accessibleSubjectIds, setAccessibleSubjectIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const reduxUser = useSelector((state: RootState) => state.user.user);
    const currentUser = reduxUser ?? securityService.getUser();
    const role: UserRole = currentUser?.role ?? "STUDENT";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────
    const loadData = async () => {
        setLoading(true);
        try {

            const [evaluationsResponse, subjectsData, groupsData] = await Promise.all([
            evaluationService.getEvaluations(),
            subjectService.getActiveSubjects(),
            groupService.getGroups(),
            ]);

            const allEvaluations = Array.isArray(evaluationsResponse.data) ? evaluationsResponse.data : [];
            const accessibleSubjects = await evaluationAuthorizationService.getAccessibleSubjectIds(currentUser);
            const accessibleGroups = await evaluationAuthorizationService.getAccessibleGroupIds(currentUser);

            const filteredEvaluations =
            currentUser?.role === "ADMIN"
                ? allEvaluations
                : allEvaluations.filter((evaluation) =>
                    accessibleSubjects.includes(evaluation.subject_id ?? "")
                );

            setEvaluations(filteredEvaluations);
            setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
            setGroups(Array.isArray(groupsData) ? groupsData : []);
            setAccessibleGroupIds(Array.isArray(accessibleGroups) ? accessibleGroups : []);
            setAccessibleSubjectIds(Array.isArray(accessibleSubjects) ? accessibleSubjects : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const groupsForFilter = role === "ADMIN"
        ? groups
        : groups.filter((group) => accessibleGroupIds.includes(group.id));
    const groupsForCrud = groupsForFilter;

    const subjectsForFilter = role === "ADMIN"
        ? subjects
        : subjects.filter((s) => accessibleSubjectIds.includes(s.id));

    // ── Helper functions for VerticalTextFormCard ──────────────────────────────
    const getFormFields = (f: Omit<Evaluation, "id">): VerticalTextFormField[] => {
        const selectedGroupId = f.group_id || groupsForCrud[0]?.id || "";

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
                value: selectedGroupId,
                options: groupsForCrud.map((group) => ({
                    label: `${group.name} - ${group.group_code} (${subjects.find((subject) => subject.id === group.subject_id)?.name ?? group.subject_id})`,
                    value: group.id,
                })),
            },
        ];
    };

    // ── useEntityCrud hook ────────────────────────────────────────────────────
    const {
        isOpen: isCrudModalOpen,
        close: closeCrudModal,
        handleAction: handleCrudAction,
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
            if (response.success === false) throw new Error(response.error || "Error al crear evaluación.");
            return response.data ?? null;
        },
        updateItem: async (id, payload) => {
            const response = await evaluationService.updateEvaluation(id, payload);
            if (response.success === false) throw new Error(response.error || "Error al actualizar evaluación.");
            return response.data ?? null;
        },
        deleteOrArchive: async (id) => {
            const response = await evaluationService.deleteEvaluation(id);
            if (response.success === false) {
                showToast("Error", response.error || "No se pudo eliminar la evaluación.", 2);
                return false;
            }
            return true;
        },
        buildFields: (f) => getFormFields(f),
        mapSaveValues: (values, f) => {
            const selectedGroup = groupsForCrud.find((group) => group.id === values.group_id);
            return {
                name: values.name ?? f.name,
                description: values.description ?? f.description,
                weight: Number(values.weight) || 0,
                subject_id: selectedGroup?.subject_id ?? f.subject_id,
                group_id: selectedGroup?.id ?? f.group_id,
            } as Omit<Evaluation, "id">;
        },
        validateSave: (values) => {
            if (!groupsForCrud.length) {
                return "No tienes grupos disponibles para crear o editar evaluaciones.";
            }

            if (!groupsForCrud.find((group) => group.id === values.group_id)) {
                return "Debes seleccionar uno de tus grupos disponibles.";
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
        confirmWith: showConfirm,
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
    });

    const handleAction = async (actionName: string, item: Record<string, any>) => {
        const evaluation = evaluations.find((current) => current.id === item.id) ?? (item as Evaluation);

        if (actionName === "view") {
            navigate(`/evaluations/${evaluation.id}/rubric`);
            return;
        }

        if (actionName === "grade") {
            navigate(`/evaluations/${evaluation.id}/califications`);
            return;
        }

        await handleCrudAction(actionName, evaluation);
    };

    // ── Table data ────────────────────────────────────────────────────────────
    const filteredEvaluations = evaluations.filter((evaluation) => {
        if (groupFilterId && evaluation.group_id !== groupFilterId) return false;
        if (subjectFilterId && evaluation.subject_id !== subjectFilterId) return false;
        if (nameFilter) {
            const name = (evaluation.name ?? "").toLowerCase();
            if (!name.includes(nameFilter.toLowerCase())) return false;
        }
        return true;
    });

    const tableData = filteredEvaluations.map((e) => ({
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
                        id: "subject_id",
                        label: "Materia",
                        placeholder: "Todas las materias",
                        type: "select",
                        options: subjectsForFilter.map((s) => ({ label: s.name, value: s.id })),
                    },
                    {
                        id: "evaluation_name",
                        label: "Nombre evaluación",
                        placeholder: "Buscar por nombre",
                        type: "text",
                    },
                ]}
                onFilterChange={(filters) => {
                    setGroupFilterId(filters.group_id ?? "");
                    setSubjectFilterId(filters.subject_id ?? "");
                    setNameFilter(filters.evaluation_name ?? "");
                }}
            />

            {/* Table — full height */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando evaluaciones…</p>
                    ) : tableData.length === 0 ? (
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
