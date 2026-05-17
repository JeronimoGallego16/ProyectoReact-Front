import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import FilterTable from "../../components/FilterTable";
import GenericTable from "../../components/GenericTable";
import PageHeader from "../../components/PageHeader";
import ModalLauncher from "../../components/ModalLauncher";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import { useEntityCrud } from "../../hooks/useEntityCrud";
import TableScroll from "../../components/TableScroll";

import { rubricService } from "../../services/RubricService";
import { groupService } from "../../services/GroupService";
import { evaluationService } from "../../services/EvaluationService";
import { evaluationAuthorizationService } from "../../utils/EvalationAuthorizationService";
import securityService from "../../services/segurity.service";

import { UserRole } from "../../models/user";
import { Rubric } from "../../models/Rubric";
import { Group } from "../../models/Group";
import { Evaluation } from "../../models/Evaluation";

// ─── Types ────────────────────────────────────────────────────────────────────
const COLUMNS = ["title", "description", "created_at", "is_public", "is_archived"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "view", label: "Ver" },
    { name: "edit", label: "Editar" },
    { name: "delete", label: "Eliminar" },
    { name: "archive", label: "Archivar" },
    { name: "publish", label: "Publicar" },
];

const STUDENT_ACTIONS = [
    { name: "view", label: "Ver" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

const emptyForm = (): Omit<Rubric, "id"> => ({
    title: "",
    description: "",
});

// ─── Component ────────────────────────────────────────────────────────────────
const RubricsPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [accessibleGroupIds, setAccessibleGroupIds] = useState<string[]>([]);
    const [groupFilterId, setGroupFilterId] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [titleFilter, setTitleFilter] = useState("");
    const [teacherHasGroups, setTeacherHasGroups] = useState(false);
    
    const user = securityService.getUser();
    const role: UserRole = user?.role ?? "STUDENT";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────
    const loadRubrics = async () => {
        setLoading(true);
        try {
            const [rubricsResponse, evaluationsResponse, groupsResponse] = await Promise.all([
                rubricService.getRubrics(),
                evaluationService.getEvaluations(),
                groupService.getGroups(),
            ]);

            const allRubrics = Array.isArray(rubricsResponse.data) ? rubricsResponse.data : [];
            const allEvaluations = Array.isArray(evaluationsResponse.data) ? evaluationsResponse.data : [];
            const allGroups = Array.isArray(groupsResponse) ? groupsResponse : [];

            const user = securityService.getUser();
            const accessibleGroups = await evaluationAuthorizationService.getAccessibleGroupIds(user);
            const teacherGroups = user?.id ? await groupService.getGroupsByTeacher(user.id) : [];

            const filteredRubrics = await Promise.all(
                allRubrics.map(async (rubric) => {
                    const relatedEvaluation = allEvaluations.find((evaluation) => evaluation.rubric_id === rubric.id);

                    const canView = await evaluationAuthorizationService.canViewRubric(
                        user,
                        relatedEvaluation ? relatedEvaluation.id : undefined,
                        allEvaluations,
                        rubric
                    );

                    return canView ? rubric : null;
                })
            );

            setRubrics(filteredRubrics.filter((rubric): rubric is Rubric => rubric !== null));
            setEvaluations(allEvaluations);
            setGroups(allGroups);
            setAccessibleGroupIds(Array.isArray(accessibleGroups) ? accessibleGroups : []);
            setTeacherHasGroups(Array.isArray(teacherGroups) && teacherGroups.length > 0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRubrics();
    }, []);

    // ── Helper functions for VerticalTextFormCard ──────────────────────────────
    const getFormFields = (f: Omit<Rubric, "id">): VerticalTextFormField[] => {
        return [
            {
                name: "title",
                label: "Título",
                placeholder: "Ingrese el título de la rúbrica",
                type: "text",
                value: f.title,
            },
            {
                name: "description",
                label: "Descripción",
                placeholder: "Ingrese la descripción de la rúbrica",
                kind: "textarea",
                rows: 3,
                value: f.description,
            },
        ];
    };

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
    } = useEntityCrud<Rubric>({
        emptyForm: emptyForm(),
        loadData: loadRubrics,
        createItem: async (payload) => {
            const response = await rubricService.createRubric(payload);
            if (!response.success) {
                throw new Error(response.error ?? "No se pudo crear la rúbrica.");
            }
            return response.data ?? null;
        },
        updateItem: async (id, payload) => {
            const response = await rubricService.updateRubric(id, payload);
            if (!response.success) {
                throw new Error(response.error ?? "No se pudo actualizar la rúbrica.");
            }
            return response.data ?? null;
        },
        deleteOrArchive: async (id, type) => {
            if (type === "delete") {
                const response = await rubricService.deleteRubric(id);
                return response.success === true;
            } else if (type === "archive") {
                const response = await rubricService.archiveRubric(id);
                return response.success === true;
            } else if (type === "publish") {
                const result = await rubricService.publishRubric(id);
                return result.success === true;
            }
            return false;
        },
        buildFields: (f) => getFormFields(f),
        mapSaveValues: (values) => ({
            title: values.title,
            description: values.description,
        }),
        validateSave: (_values, _form, mode) => {
            if (mode === "create" && !teacherHasGroups) {
                return "No puedes crear una rúbrica: debes tener al menos un grupo asignado.";
            }
            return null;
        },
        getFormTitle: (mode) => {
            if (mode === "create") return "Crear Rúbrica";
            if (mode === "edit") return "Editar Rúbrica";
            return "";
        },
        getFormDescription: (mode, item) => {
            if (item && mode === "edit") {
                return `Título: ${item.title ?? "—"}`;
            }
            return "";
        },
        getConfirmMessage: (type, item) => {
            if (type === "delete") {
                return `Eliminar la rúbrica "${item.title ?? item.id}"? Esta acción no se puede deshacer.`;
            } else if (type === "archive") {
                return `Archivar la rúbrica "${item.title ?? item.id}"? Se despublicará y quedará archivada.`;
            } else if (type === "publish") {
                return `Publicar la rúbrica "${item.title ?? item.id}"? Verifica que tenga los criterios necesarios.`;
            }
            return "";
        },
        successMessages: {
            create: "Rúbrica creada exitosamente.",
            update: "Rúbrica actualizada exitosamente.",
            delete: "Rúbrica eliminada exitosamente.",
            archive: "Rúbrica archivada exitosamente.",
            publish: "Rúbrica publicada exitosamente.",
        },
        errorMessages: {
            create: "No se pudo crear la rúbrica.",
            update: "No se pudo actualizar la rúbrica.",
            delete: "No se pudo eliminar la rúbrica. Puede que ya esté publicada.",
            archive: "No se pudo archivar la rúbrica.",
            publish: "No se pudo publicar la rúbrica.",
        },
        onAction: async (actionName, item) => {
            if (actionName === "view") {
                navigate(`/rubrics/${item.id}/criteria`);
            }
        },
    });

    // ── Data transformations ────────────────────────────────────────────────────
    const groupsForFilter = role === "ADMIN"
        ? groups
        : groups.filter((group) => accessibleGroupIds.includes(group.id));

    const filteredRubrics = rubrics.filter((rubric) => {
        if (groupFilterId && !evaluations.some((evaluation) => evaluation.rubric_id === rubric.id && evaluation.group_id === groupFilterId)) {
            return false;
        }

        if (statusFilter) {
            if (statusFilter === "public" && !rubric.is_public) return false;
            if (statusFilter === "archived" && !rubric.is_archived) return false;
        }

        if (titleFilter) {
            const title = (rubric.title ?? "").toLowerCase();
            if (!title.includes(titleFilter.toLowerCase())) return false;
        }

        return true;
    });

    const tableData = filteredRubrics.map((r) => ({
        ...r,
        created_at: r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
        is_public: r.is_public ? "Sí" : "No",
        is_archived: r.is_archived ? "Sí" : "No",
    }));

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Page header */}
            <PageHeader
                title="Rúbricas"
                description={editable
                    ? "Gestiona tus rúbricas: crea, edita, archiva o elimina"
                    : "Busca y navega por las rúbricas disponibles."}
                primaryAction={editable ? {
                    label: "+ Nueva Rúbrica",
                    onClick: startCreate,
                } : undefined}
            />

            {/* Informational note about deletion constraints */}
            {editable && (
            <div className="mb-4 rounded-sm border-l-4 border-yellow-400 bg-yellow-50 px-4 py-3">
                <p className="text-sm text-body dark:text-bodydark">
                    Atención: No se puede eliminar una rúbrica que ya fue usada para calificar una evaluación. Esto también aplica a sus criterios y escalas asociados.
                </p>
            </div>
            )}

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
                        id: "status",
                        label: "Estado",
                        placeholder: "Todas",
                        type: "select",
                        options: [
                            { value: "", label: "Todas" },
                            { value: "public", label: "Pública" },
                            { value: "archived", label: "Archivada" },
                        ],
                    },
                    {
                        id: "title",
                        label: "Título",
                        placeholder: "Buscar por título",
                        type: "text",
                    },
                ]}
                onFilterChange={(filters) => {
                    setGroupFilterId(filters.group_id ?? "");
                    setStatusFilter(filters.status ?? "");
                    setTitleFilter(filters.title ?? "");
                }}
            />

            {/* Table — full height */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando rúbricas…</p>
                    ) : rubrics.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron rúbricas.</p>
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

export default RubricsPage;