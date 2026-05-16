import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GenericTable from "../../components/GenericTable";
import TableScroll from "../../components/TableScroll";
import SelectableTable from "../../components/SelectableTable";
import EntityHeader from "../../components/EntityHeader";
import ModalLauncher from "../../components/ModalLauncher";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import { rubricService } from "../../services/RubricService";
import { Criterion } from "../../models/Criterion";
import { Scale } from "../../models/Scale";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
import { useCopyScaleModal } from "../../hooks/useCopyScaleModal";
import { useEntityCrud } from "../../hooks/useEntityCrud";

// ─── Types ────────────────────────────────────────────────────────────────────

const COLUMNS = ["name", "description", "value"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "edit", label: "Edit" },
    { name: "delete", label: "Delete" },
    { name: "copy", label: "Copiar a..." },
];

// Students have no actions — table is read-only, radio is visual only
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
    const [scales, setScales] = useState<Scale[]>([]);
    const [loading, setLoading] = useState(true);

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";
    
    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Helper functions for VerticalTextFormCard ──────────────────────────────

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

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadScalesByCriterion = async () => {
        if (!criterionId) return;
        setLoading(true);
        const [criterionResponse, scalesResponse] = await Promise.all([
            rubricService.getCriterionById(criterionId),
            rubricService.getScaleByCriterionId(criterionId),
        ]);
        setCriterion(criterionResponse.data || null);
        setScales(Array.isArray(scalesResponse.data) ? scalesResponse.data : []);
        setLoading(false);
    };

    useEffect(() => {
        loadScalesByCriterion();
    }, [criterionId]);

    // ── useCopyScaleModal hook ────────────────────────────────────────────────

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
        onCopySuccess: loadScalesByCriterion,
    });

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
    } = useEntityCrud<Scale>({
        emptyForm: emptyForm(),
        loadData: loadScalesByCriterion,
        createItem: async (payload) => {
            const fullPayload = { ...payload, criterion_id: criterionId } as Omit<Scale, "id">;
            const response = await rubricService.createScale(fullPayload);
            return response.data ?? null;
        },
        updateItem: async (id, payload) => {
            const response = await rubricService.updateScale(id, {
                name: payload.name,
                description: payload.description,
                value: payload.value,
            });
            return response.data ?? null;
        },
        deleteOrArchive: async (id) => {
            const response = await rubricService.updateScale(id, { criterion_id: undefined });
            return !!response.data;
        },
        buildFields: (f) => getFormFields(f),
        mapSaveValues: (values) => ({
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
        onAction: async (actionName, item) => {
            if (actionName === "copy") {
                await openCopyModal(item);
            }
        },
    });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Entity header with back button and criterion info */}
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

            {/* Copy scale modal */}
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

            {/* Page header */}
            <PageHeader
                title="Escalas"
                description={editable
                    ? "Gestiona tus escalas para este criterio. Selecciona una para asignarla."
                    : "Explora las escalas para este criterio."}
                primaryAction={editable ? {
                    label: "+ Nueva Escala",
                    onClick: startCreate,
                } : undefined}
            >
            </PageHeader>

            {/* Table */}
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
                        <TableScroll maxHeight={isCrudModalOpen ? '20vh' : '55vh'}>
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

export default ScalesByCriterionPage;