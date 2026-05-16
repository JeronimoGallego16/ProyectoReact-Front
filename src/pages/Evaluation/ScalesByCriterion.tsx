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
import { showToast } from "../../hooks/fireToast";
import { useCrudModal } from "../../hooks/useCrudModal";
import { useCopyScaleModal } from "../../hooks/useCopyScaleModal";

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
    const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);

    const {
        crudMode,
        selectedItem: selectedScale, // Renombramos para mantener consistencia con tu código
        form,
        setForm,
        resetCrud,
        startCreate,
        startEdit,
    } = useCrudModal<Scale>(emptyForm());

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";
    
    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadData = async () => {
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

    useEffect(() => {
        loadData();
    }, [criterionId]);

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const scale = item as Scale;

        if (actionName === "edit") {
            startEdit(scale);
            setIsCrudModalOpen(true);
        }

        if (actionName === "delete") {
             void handleDelete(scale);
        }

        if (actionName === "copy") {
            void openCopyModal(scale);
        }
    };

    const handleDelete = async (scale: Scale) => {
        const ok = window.confirm(`Eliminar escala "${scale.name}" de este criterio?`);
        if (!ok) return;

        const response = await rubricService.updateScale(scale.id, { criterion_id: undefined });
        if (response.data) {
            showToast("Éxito", "Escala desvinculada del criterio.", 0);
            await loadData();
        } else {
            showToast("Error", "No se pudo desvincular la escala.", 2);
        }
    };

    const getFormTitle = (): string => {
        if (crudMode === "create") return "Crear Escala";
        if (crudMode === "edit") return `Editar Escala: ${selectedScale?.name ?? selectedScale?.id}`;
        return "";
    };

    const getFormDescription = (): string => {
        if (selectedScale && crudMode === "edit") {
            return `ID: ${selectedScale.id} • Value: ${selectedScale.value ?? "—"}`;
        }
        return "";
    };

    const getFormFields = (): VerticalTextFormField[] => {
        return [
            {
                name: "name",
                label: "Name",
                placeholder: "Enter scale name",
                type: "text",
                value: form.name,
            },
            {
                name: "description",
                label: "Description",
                placeholder: "Enter scale description",
                kind: "textarea",
                rows: 3,
                value: form.description,
            },
            {
                name: "value",
                label: "Value",
                placeholder: "Enter scale value",
                type: "number",
                value: String(form.value),
            },
        ];
    };

    const getFormSaveLabel = (): string => {
        if (crudMode === "create") return "Create";
        if (crudMode === "edit") return "Save Changes";
        return "Save";
    };

    const handleFormSave = async (values: Record<string, string>) => {
        const nextForm: Omit<Scale, "id"> = {
            ...form,
            name: values.name ?? form.name,
            description: values.description ?? form.description,
            value: Number(values.value) ?? form.value,
            criterion_id: criterionId ?? "",
        };

        setForm(nextForm);

        if (crudMode === "create") {
            const response = await rubricService.createScale(nextForm);
            if (response.data) {
                showToast("Éxito", "Escala creada exitosamente.", 0);
                    setIsCrudModalOpen(false);
                    resetCrud();
                await loadData();
            } else {
                showToast("Error", "No se pudo crear la escala.", 2);
            }
            return;
        }

        if (crudMode === "edit" && selectedScale) {
            const response = await rubricService.updateScale(selectedScale.id, {
                name: nextForm.name,
                description: nextForm.description,
                value: nextForm.value,
            });
            if (response.data) {
                showToast("Éxito", "Escala actualizada exitosamente.", 0);
                    setIsCrudModalOpen(false);
                    resetCrud();
                await loadData();
            } else {
                showToast("Error", "No se pudo actualizar la escala.", 2);
            }
        }
    };

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

                            <div className="max-h-[50vh] overflow-y-auto">
                                {loadingTargets ? (
                                    <p className="p-4 text-sm text-body dark:text-bodydark">Cargando criterios destino…</p>
                                ) : targetCriteria.length === 0 ? (
                                    <p className="p-4 text-sm text-body dark:text-bodydark">No hay criterios disponibles para copiar esta escala.</p>
                                ) : (
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
                                )}
                            </div>

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
                primaryAction={{ label: "+ Nueva Escala", onClick: () => { startCreate(); setIsCrudModalOpen(true); } }}
            >
            </PageHeader>

            {/* Table */}
            <div
                className={`overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark transition-all duration-300 ${
                    crudMode ? "max-h-80" : "max-h-[60vh]"
                }`}
            >
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando escalas…</p>
                    ) : scales.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se econtraron escalas para este criterio.</p>
                    ) : (
                        <TableScroll maxHeight={crudMode ? '20vh' : '55vh'}>
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
            {editable && crudMode && (
                <ModalLauncher isOpen={isCrudModalOpen} onClose={() => { setIsCrudModalOpen(false); resetCrud(); }}>
                    {() => (
                        <VerticalTextFormCard
                            title={getFormTitle()}
                            description={getFormDescription()}
                            fields={getFormFields()}
                            saveLabel={getFormSaveLabel()}
                            cancelLabel="Cancelar"
                            onSave={handleFormSave}
                            onCancel={() => { setIsCrudModalOpen(false); resetCrud(); }}
                        />
                    )}
                </ModalLauncher>
            )}

        </div>
    );
};

export default ScalesByCriterionPage;