import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GenericTable from "../../components/GenericTable";
import PageHeader from "../../components/PageHeader";
import EntityHeader from "../../components/EntityHeader";
import ModalLauncher from "../../components/ModalLauncher";
import TableScroll from "../../components/TableScroll";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import { showToast } from "../../hooks/fireToast";
import { useEntityCrud } from "../../hooks/useEntityCrud";
import { useSwalConfirm } from '../../hooks/useSwalConfirm';

import { rubricService } from "../../services/RubricService";
import { criterionService } from "../../services/CriterionService";
import { evaluationService } from "../../services/EvaluationService";
import securityService from "../../services/segurity.service";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { canUserViewRubric, fetchCriteriaAndScalesByRubric, extractItem, extractList } from "../../utils/dataResolvers";

import { Rubric } from "../../models/Rubric";
import { Criterion } from "../../models/Criterion";
import { UserRole } from "../../models/user";

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
    
    const reduxUser = useSelector((state: RootState) => state.user.user);
    const currentUser = reduxUser ?? securityService.getUser();
    const role: UserRole = currentUser?.role ?? "STUDENT";
    const editable = canEdit(role);
    const { showConfirm } = useSwalConfirm();

    const handleCreateCriterion = () => {
        if (rubric?.is_public) {
            showToast("Error", "No puedes crear criterios en una rúbrica publicada. Archívala primero.", 2);
            return;
        }

        startCreate();
    };

    const loadData = async () => {
        if (!rubricId) return;
        setLoading(true);

        try {
            const [rubricResponse, evaluationsResponse, rubricContent] = await Promise.all([
                rubricService.getRubricById(rubricId),
                evaluationService.getEvaluations(),
                fetchCriteriaAndScalesByRubric(rubricId),
            ]);

            const allEvaluations = extractList(evaluationsResponse);

            const rubricData = extractItem(rubricResponse);
            const canAccess = await canUserViewRubric(currentUser, rubricData, allEvaluations);

            if (!canAccess) {
                showToast("Error", "No tienes permisos para ver esta rúbrica.", 2);
                navigate(-1);
                return;
            }

            setRubric(rubricData);
            setCriteria(rubricContent.criteria);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [rubricId]);

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

    const getCriteriaTotal = (excludedCriterionId?: string) => {
        return criteria
            .filter((criterion) => criterion.id !== excludedCriterionId)
            .reduce((sum, criterion) => sum + (Number(criterion.weight) || 0), 0);
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
    } = useEntityCrud<Criterion>({
        emptyForm: emptyForm(),
        loadData,
        createItem: async (payload) => {
            const fullPayload = { ...payload, rubric_id: rubricId } as Omit<Criterion, "id">;
            const response = await criterionService.createCriterion(fullPayload);
            if (response.success === false) throw new Error(response.error || "Error al crear criterio.");
            return response.data ?? null;
        },
        updateItem: async (id, payload) => {
            const response = await criterionService.updateCriterion(id, {
                name: payload.name,
                description: payload.description,
                weight: payload.weight,
            });
            if (response.success === false) throw new Error(response.error || "Error al actualizar criterio.");
            return response.data ?? null;
        },
        deleteOrArchive: async (id) => {
            const response = await criterionService.deleteCriterion(id);
            if (response.success === false) {
                showToast("Error", response.error || "No se pudo eliminar el criterio.", 2);
                return false;
            }
            return true;
        },
        buildFields: (f) => getFormFields(f),
        mapSaveValues: (values) => ({
            rubric_id: rubricId ?? "",
            name: values.name,
            description: values.description,
            weight: Number(values.weight) || 0,
        }),
        validateSave: (values, _form, mode, selectedItem) => {
            const totalWeight = getCriteriaTotal(mode === "edit" ? selectedItem?.id : undefined);
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
        confirmWith: showConfirm,
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
    });

    const handleAction = async (actionName: string, item: Record<string, any>) => {
        const criterion = item as Criterion;

        if (actionName === "view") {
            navigate(`/criteria/${criterion.id}/scales`);
            return;
        }

        if (actionName === "edit" && rubric?.is_public) {
            showToast("Error", "No puedes editar criterios de una rúbrica publicada. Archívala primero.", 2);
            return;
        }

        if (actionName === "delete" && rubric?.is_public) {
            showToast("Error", "No puedes eliminar criterios de una rúbrica publicada. Archívala primero.", 2);
            return;
        }

        await handleCrudAction(actionName, criterion);
    };

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
                    onClick: handleCreateCriterion,
                } : undefined}
            >
            </PageHeader>

            {/* Nota sobre pesos (solo visible para administradores/docentes) */}
            {editable && (
                <div className="mt-3 mb-4">
                    {(() => {
                        const totalWeight = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
                        const ok = totalWeight === 100;
                        return (
                            <div className={`rounded-sm p-3 text-sm ${ok ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-800'}`}>
                                <strong>Nota:</strong> La suma de los pesos de los criterios debe ser 100. Total actual: <span className={`font-medium ${ok ? 'text-green-800' : 'text-yellow-900'}`}>{totalWeight}</span>.
                            </div>
                        );
                    })()}
                </div>
            )}

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