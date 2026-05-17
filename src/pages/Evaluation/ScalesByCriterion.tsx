import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GenericTable from "../../components/GenericTable";
import TableScroll from "../../components/TableScroll";
import SelectableTable from "../../components/SelectableTable";
import EntityHeader from "../../components/EntityHeader";
import ModalLauncher from "../../components/ModalLauncher";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import { showToast } from "../../hooks/fireToast";
import { useCopyScaleModal } from "../../hooks/useCopyScaleModal";
import { useEntityCrud } from "../../hooks/useEntityCrud";

import { criterionService } from "../../services/CriterionService";
import { rubricService } from "../../services/RubricService";
import { scaleService } from "../../services/ScaleService";
import securityService from "../../services/segurity.service";
import { canUserViewRubric, extractItem, fetchCriteriaAndScalesByRubric } from "../../utils/dataResolvers";

import { Criterion } from "../../models/Criterion";
import { Rubric } from "../../models/Rubric";
import { Scale } from "../../models/Scale";
import { UserRole } from "../../models/user";

// ─── Types ────────────────────────────────────────────────────────────────────
const COLUMNS = ["name", "description", "value"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "edit", label: "Edit" },
    { name: "delete", label: "Delete" },
    { name: "copy", label: "Copiar a..." },
];

const STUDENT_ACTIONS: { name: string; label: string }[] = [];

const TARGET_CRITERIA_COLUMNS = ["name", "description", "weight"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

const emptyForm = (): Omit<Scale, "id"> => ({
    criterion_id: "",
    name: "",
    description: "",
    value: 0,
});

// ─── Component ────────────────────────────────────────────────────────────────
const ScalesByCriterionPage: React.FC = () => {
    const { criterionId } = useParams<{ criterionId: string }>();
    const navigate = useNavigate();
    const onBack = () => navigate(-1);

    const [criterion, setCriterion] = useState<Criterion | null>(null);
    const [rubric, setRubric] = useState<Rubric | null>(null);
    const [scales, setScales] = useState<Scale[]>([]);
    const [loading, setLoading] = useState(true);

    const user = securityService.getUser();
    const role: UserRole = user?.role ?? "STUDENT";
    const editable = canEdit(role);

    const loadData = async () => {
        if (!criterionId) return;

        setLoading(true);
        try {
            const criterionResponse = await criterionService.getCriterionById(criterionId);

            const criterionData = extractItem(criterionResponse);
            setCriterion(criterionData);

            if (criterionData?.rubric_id) {
                const [rubricResponse, rubricContent] = await Promise.all([
                    rubricService.getRubricById(criterionData.rubric_id),
                    fetchCriteriaAndScalesByRubric(criterionData.rubric_id),
                ]);
                const rubricData = extractItem(rubricResponse);
                const canAccess = await canUserViewRubric(user, rubricData);

                if (!canAccess) {
                    showToast("Error", "No tienes permisos para ver estas escalas.", 2);
                    navigate(-1);
                    return;
                }

                setRubric(rubricData);
                setCriterion(rubricContent.criteria.find((current) => current.id === criterionId) ?? criterionData);
                setScales(rubricContent.scalesByCriterion[criterionId] ?? []);
            } else {
                setRubric(null);
                setScales([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [criterionId]);

    const handleCreateScale = () => {
        if (rubric?.is_public) {
            showToast("Error", "No puedes crear escalas en una rúbrica publicada. Archívala primero.", 2);
            return;
        }

        startCreate();
    };

    const getFormFields = (f: Omit<Scale, "id">): VerticalTextFormField[] => {
        return [
            {
                name: "name",
                label: "Name",
                placeholder: "Enter scale name",
                type: "text",
                value: f.name,
            },
            {
                name: "description",
                label: "Description",
                placeholder: "Enter scale description",
                kind: "textarea",
                rows: 3,
                value: f.description,
            },
            {
                name: "value",
                label: "Value",
                placeholder: "Enter scale value",
                type: "number",
                value: String(f.value),
            },
        ];
    };

    const {
        isCopyModalOpen,
        sourceScale,
        targetCriteria,
        selectedTargetIds,
        loadingTargets,
        isCopying,
        openCopyModal,
        closeCopyModal,
        toggleTargetSelection,
        handleCopyToSelectedCriteria,
    } = useCopyScaleModal({
        criterionId,
        rubricId: criterion?.rubric_id,
        onCopySuccess: loadData,
    });

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
    } = useEntityCrud<Scale>({
        emptyForm: emptyForm(),
        loadData,
        createItem: async (payload: Omit<Scale, "id">) => {
            const fullPayload = { ...payload, criterion_id: criterionId } as Omit<Scale, "id">;
            const response = await scaleService.createScale(fullPayload);
            if (response.success === false) throw new Error(response.error || "Error al crear escala.");
            return response.data ?? null;
        },
        updateItem: async (id: string, payload: Omit<Scale, "id">) => {
            const response = await scaleService.updateScale(id, {
                name: payload.name,
                description: payload.description,
                value: payload.value,
            });
            if (response.success === false) throw new Error(response.error || "Error al actualizar escala.");
            return response.data ?? null;
        },
        deleteOrArchive: async (id: string) => {
            const response = await scaleService.deleteScale(id);
            if (response.success === false) {
                showToast("Error", response.error || "No se pudo desvincular la escala.", 2);
                return false;
            }
            return true;
        },
        buildFields: (f: Omit<Scale, "id">) => getFormFields(f),
        mapSaveValues: (values: Record<string, string>) => ({
            criterion_id: criterionId ?? "",
            name: values.name,
            description: values.description,
            value: Number(values.value) ?? 0,
        }),
        getFormTitle: (mode, item) => {
            if (mode === "create") return "Crear Escala";
            if (mode === "edit") return `Editar Escala: ${item?.name ?? item?.id}`;
            return "";
        },
        getFormDescription: (mode, item) => {
            if (item && mode === "edit") {
                return `ID: ${item.id} • Value: ${item.value ?? "—"}`;
            }
            return "";
        },
        getConfirmMessage: (type, item) => {
            if (type === "delete") {
                return `Eliminar escala "${item.name}" de este criterio?`;
            }
            return "";
        },
        successMessages: {
            create: "Escala creada exitosamente.",
            update: "Escala actualizada exitosamente.",
            delete: "Escala desvinculada del criterio.",
        },
        errorMessages: {
            create: "No se pudo crear la escala.",
            update: "No se pudo actualizar la escala.",
            delete: "No se pudo desvincular la escala.",
        },
        onAction: async (actionName: string, item: Scale) => {
            if (actionName === "copy") {
                await openCopyModal(item);
            }
        },
    });

    const handleAction = async (actionName: string, item: Record<string, any>) => {
        if (actionName === "copy") {
            await openCopyModal(item as Scale);
            return;
        }

        if ((actionName === "edit" || actionName === "delete") && rubric?.is_public) {
            showToast(
                "Error",
                actionName === "edit"
                    ? "No puedes editar escalas de una rúbrica publicada. Archívala primero."
                    : "No puedes eliminar escalas de una rúbrica publicada. Archívala primero.",
                2
            );
            return;
        }

        await handleCrudAction(actionName, item as Scale);
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {criterion && (
                <EntityHeader
                    onBack={onBack}
                    backLabel="← Volver"
                    title={criterion.name ?? criterion.id}
                    description={criterion.description}
                    entityType="Criterio"
                >
                    {criterion.weight !== undefined && (
                        <p className="text-sm text-body dark:text-bodydark">Peso: {criterion.weight}</p>
                    )}
                </EntityHeader>
            )}

            {isCopyModalOpen && (
                <ModalLauncher isOpen={isCopyModalOpen} onClose={closeCopyModal}>
                    {() => (
                        <div>
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-black dark:text-white">
                                    Copiar escala a otros criterios
                                </h3>
                                <p className="mt-2 text-sm text-body dark:text-bodydark">
                                    Escala origen: <span className="font-medium text-black dark:text-white">{sourceScale?.name ?? sourceScale?.id}</span>
                                </p>
                            </div>

                            <p className="mb-4 text-sm text-body dark:text-bodydark">
                                Selecciona uno o varios criterios destino para copiar la escala sin perder la original.
                            </p>

                            {loadingTargets ? (
                                <p className="p-4 text-sm text-body dark:text-bodydark">Cargando criterios destino…</p>
                            ) : targetCriteria.length === 0 ? (
                                <p className="p-4 text-sm text-body dark:text-bodydark">No hay criterios disponibles para copiar esta escala.</p>
                            ) : (
                                <TableScroll maxHeight="50vh">
                                    <SelectableTable
                                        data={targetCriteria}
                                        columns={TARGET_CRITERIA_COLUMNS}
                                        actions={[]}
                                        onAction={(actionName, item) => {
                                            if (actionName === "select") {
                                                toggleTargetSelection((item as Criterion).id);
                                            }
                                        }}
                                        selectionMode={2}
                                    />
                                </TableScroll>
                            )}

                            <div className="mt-5 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeCopyModal}
                                    className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleCopyToSelectedCriteria()}
                                    disabled={loadingTargets || isCopying || targetCriteria.length === 0}
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isCopying ? "Copiando..." : `Copiar a seleccionados (${selectedTargetIds.size})`}
                                </button>
                            </div>
                        </div>
                    )}
                </ModalLauncher>
            )}

            <PageHeader
                title="Escalas"
                description={editable
                    ? "Gestiona tus escalas para este criterio. Selecciona una para asignarla."
                    : "Explora las escalas para este criterio."}
                primaryAction={editable ? {
                    label: "+ Nueva Escala",
                    onClick: handleCreateScale,
                } : undefined}
            />

            <div
                className={`overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark transition-all duration-300 ${
                    isCrudModalOpen ? "max-h-80" : "max-h-[60vh]"
                }`}
            >
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando escalas…</p>
                    ) : scales.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se econtraron escalas para este criterio.</p>
                    ) : (
                        <TableScroll maxHeight={isCrudModalOpen ? "20vh" : "55vh"}>
                            <GenericTable
                                data={scales}
                                columns={COLUMNS}
                                actions={editable ? ADMIN_TEACHER_ACTIONS : STUDENT_ACTIONS}
                                onAction={handleAction}
                            />
                        </TableScroll>
                    )}
                </div>
            </div>

            {editable && isCrudModalOpen && (
                <ModalLauncher isOpen={isCrudModalOpen} onClose={closeCrudModal}>
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

export default ScalesByCriterionPage;
