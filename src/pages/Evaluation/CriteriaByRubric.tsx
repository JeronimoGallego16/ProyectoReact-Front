import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import TableScroll from "../../components/TableScroll";
import PageHeader from "../../components/PageHeader";
import EntityHeader from "../../components/EntityHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import ModalLauncher from "../../components/ModalLauncher";
import { rubricService } from "../../services/RubricService";
import { Rubric } from "../../models/Rubric";
import { Criterion } from "../../models/Criterion";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
import { useNavigate, useParams } from "react-router-dom";
import { showToast } from "../../hooks/fireToast";
import { useEntityCrud } from "../../hooks/useEntityCrud";

// ─── Types ────────────────────────────────────────────────────────────────────

const COLUMNS = ["name", "description", "weight"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "view", label: "Ver Escalas" },
    { name: "edit", label: "Editar" },
    { name: "delete", label: "Eliminar" },
];

const STUDENT_ACTIONS = [
    { name: "view", label: "Ver Escalas" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

const emptyForm = (): Omit<Criterion, "id"> => ({
    rubric_id: "",
    name: "",
    description: "",
    weight: 0,
});

// ─── Component ────────────────────────────────────────────────────────────────

const CriteriaByRubricPage: React.FC = () => {
    const { rubricId } = useParams<{ rubricId: string }>();
    const navigate = useNavigate();
    const onBack = () => navigate(-1);

    const [rubric, setRubric] = useState<Rubric | null>(null);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [loading, setLoading] = useState(true);

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Helper functions for VerticalTextFormCard ──────────────────────────────

    const getFormFields = (f: Omit<Criterion, "id">): VerticalTextFormField[] => {
        return [
            {
                name: "name",
                label: "Nombre",
                placeholder: "Ingrese el nombre del criterio",
                type: "text",
                value: f.name,
            },
            {
                name: "description",
                label: "Descripción",
                placeholder: "Ingrese la descripción del criterio",
                kind: "textarea",
                rows: 3,
                value: f.description,
            },
            {
                name: "weight",
                label: "Peso",
                placeholder: "Ingrese el peso del criterio (0-100)",
                type: "number",
                value: String(f.weight),
            },
        ];
    };

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadCriteriaByRubric = async () => {
        if (!rubricId) return;
        setLoading(true);
        const [rubricResponse, criteriaResponse] = await Promise.all([
            rubricService.getRubricById(rubricId),
            rubricService.getCriteriaByRubricId(rubricId),
        ]);
        setRubric(rubricResponse.data || null);
        setCriteria(Array.isArray(criteriaResponse.data) ? criteriaResponse.data : []);
        setLoading(false);
    };

    useEffect(() => {
        loadCriteriaByRubric();
    }, [rubricId]);

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
    } = useEntityCrud<Criterion>({
        emptyForm: emptyForm(),
        loadData: loadCriteriaByRubric,
        createItem: async (payload) => {
            const fullPayload = { ...payload, rubric_id: rubricId } as Omit<Criterion, "id">;
            const response = await rubricService.createCriterion(fullPayload);
            return response.data ?? null;
        },
        updateItem: async (id, payload) => {
            const response = await rubricService.updateCriterion(id, {
                name: payload.name,
                description: payload.description,
                weight: payload.weight,
            });
            return response.data ?? null;
        },
        deleteOrArchive: async (id) => {
            const response = await rubricService.deleteCriterion(id);
            return !response?.error;
        },
        buildFields: (f) => getFormFields(f),
        mapSaveValues: (values) => ({
            rubric_id: rubricId ?? "",
            name: values.name,
            description: values.description,
            weight: Number(values.weight) || 0,
        }),
        validateSave: (values) => {
            const totalWeight = criteria.reduce((sum, c) => sum + (c.weight ?? 0), 0);
            const newWeight = Number(values.weight) || 0;
            if (totalWeight + newWeight > 100) {
                return `La suma de pesos no puede exceder 100%. Actual: ${totalWeight}% + ${newWeight}% = ${totalWeight + newWeight}%.`;
            }
            return null;
        },
        getFormTitle: (mode) => {
            if (mode === "create") return "Crear Criterio";
            if (mode === "edit") return "Editar Criterio";
            return "";
        },
        getFormDescription: (mode, item) => {
            if (item && mode === "edit") {
                return `Nombre: ${item.name} - Peso: ${item.weight}`;
            }
            return "";
        },
        getConfirmMessage: (type, item) => {
            if (type === "delete") {
                return `¿Eliminar el criterio "${item.name}"? Esta acción no se puede deshacer.`;
            }
            return "";
        },
        successMessages: {
            create: "Criterio creado exitosamente.",
            update: "Criterio actualizado exitosamente.",
            delete: "Criterio eliminado exitosamente.",
        },
        errorMessages: {
            create: "No se pudo crear el criterio. Verifique que la suma de pesos no exceda 100.",
            update: "No se pudo actualizar el criterio.",
            delete: "No se pudo eliminar el criterio.",
        },
        onAction: async (actionName, item) => {
            if (actionName === "view") {
                navigate(`/criteria/${item.id}/scales`);
            } else if (actionName === "edit") {
                if (rubric?.is_public) {
                    showToast("Error", "No puedes editar criterios de una rúbrica publicada. Archívala primero.", 2);
                    return;
                }
            } else if (actionName === "delete") {
                if (rubric?.is_public) {
                    showToast("Error", "No puedes eliminar criterios de una rúbrica publicada. Archívala primero.", 2);
                    return;
                }
            }
        },
    });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Entity header with back button and rubric info */}
            {rubric && (
                <EntityHeader
                    onBack={onBack}
                    backLabel="← Volver"
                    title={rubric.title ?? rubric.id}
                    description={rubric.description}
                />
            )}

            {/* Page header */}
            <PageHeader
                title="Criterios"
                description={editable
                    ? "Gestiona tus criterios para esta rúbrica. Asigna, crea, edita y elimina."
                    : "Busca y navega por los criterios de esta rúbrica."}
                primaryAction={editable ? {
                    label: "+ Nuevo Criterio",
                    onClick: startCreate,
                } : undefined}
            >
            </PageHeader>

            {/* Table — full height */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[60vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando criterios…</p>
                    ) : criteria.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron criterios para esta rúbrica.</p>
                    ) : (
                        <TableScroll maxHeight="55vh">
                            <GenericTable
                                data={criteria}
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

export default CriteriaByRubricPage;