import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SelectableTable from "../../components/SelectableTable";
import AppModal from "../../components/AppModal";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import { rubricService } from "../../services/RubricService";
import { Criterion } from "../../models/Criterion";
import { Scale } from "../../models/Scale";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
import { showToast } from "../../hooks/fireToast";

// ─── Types ────────────────────────────────────────────────────────────────────

type CrudMode = "create" | "edit" | null;

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

    const [criterion, setCriterion] = useState<Criterion | null>(null);
    const [scales, setScales] = useState<Scale[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [crudMode, setCrudMode] = useState<CrudMode>(null);
    const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
    const [form, setForm] = useState<Omit<Scale, "id">>(emptyForm());
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [sourceScale, setSourceScale] = useState<Scale | null>(null);
    const [targetCriteria, setTargetCriteria] = useState<Criterion[]>([]);
    const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

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

    useEffect(() => {
        loadData();
    }, [criterionId]);

    // ── Selection (radio — single) ────────────────────────────────────────────

    const handleAssignSelected = async () => {
        if (!selectedId || !criterionId) {
            showToast("Error", "No hay una escala seleccionada.", 2);
            return;
        }

        const response = await rubricService.updateScale(selectedId, { criterion_id: criterionId });
        const updated = response.data;
        if (updated) {
            showToast("Éxito", "Escala asignada al criterio exitosamente.", 0);
            setSelectedId(null);
            await loadData();
        } else {
            showToast("Error", "No se pudo asignar la escala al criterio.", 2);
        }
    };

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const scale = item as Scale;

        if (actionName === "select") {
            setSelectedId((prev) => (prev === scale.id ? null : scale.id));
            return;
        }

        if (actionName === "edit") {
            setSelectedScale(scale);
            setForm({
                criterion_id: scale.criterion_id ?? criterionId ?? "",
                name: scale.name ?? "",
                description: scale.description ?? "",
                value: scale.value ?? 0,
            });
            setCrudMode("edit");
        }

        if (actionName === "delete") {
             void handleDelete(scale);
        }

        if (actionName === "copy") {
            void openCopyModal(scale);
        }
    };

    const openCopyModal = async (scale: Scale) => {
        if (!criterion?.rubric_id) {
            showToast("Error", "No se pudo determinar la rúbrica del criterio actual.", 2);
            return;
        }

        setSourceScale(scale);
        setSelectedTargetIds(new Set());
        setIsCopyModalOpen(true);
        setLoadingTargets(true);

        const response = await rubricService.getCriteriaByRubricId(criterion.rubric_id);
        const allCriteria = Array.isArray(response.data) ? response.data : [];
        const availableTargets = allCriteria.filter((item) => item.id !== criterionId);
        setTargetCriteria(availableTargets);
        setLoadingTargets(false);
    };

    const closeCopyModal = () => {
        setIsCopyModalOpen(false);
        setSourceScale(null);
        setTargetCriteria([]);
        setSelectedTargetIds(new Set());
    };

    const toggleTargetSelection = (targetCriterionId: string) => {
        setSelectedTargetIds((prev) => {
            const next = new Set(prev);
            next.has(targetCriterionId) ? next.delete(targetCriterionId) : next.add(targetCriterionId);
            return next;
        });
    };

    const handleCopyToSelectedCriteria = async () => {
        if (!sourceScale) {
            showToast("Error", "No hay una escala seleccionada para copiar.", 2);
            return;
        }

        if (selectedTargetIds.size === 0) {
            showToast("Error", "Selecciona al menos un criterio destino.", 2);
            return;
        }

        setIsCopying(true);
        let successCount = 0;
        let failCount = 0;

        for (const targetCriterionId of selectedTargetIds) {
            const response = await rubricService.copyScaleToCriterion(sourceScale.id, targetCriterionId);
            if (response.data) {
                successCount += 1;
            } else {
                failCount += 1;
            }
        }

        setIsCopying(false);

        if (successCount > 0) {
            showToast(
                failCount === 0 ? "Éxito" : "Error",
                `${successCount} copia(s) realizada(s).${failCount > 0 ? ` ${failCount} no se pudieron copiar.` : ""}`,
                failCount === 0 ? 0 : 2
            );
            closeCopyModal();
            return;
        }

        showToast("Error", "No se pudo copiar la escala a los criterios seleccionados.", 2);
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
                closeCrud();
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
                closeCrud();
                await loadData();
            } else {
                showToast("Error", "No se pudo actualizar la escala.", 2);
            }
        }
    };

    const closeCrud = () => {
        setCrudMode(null);
        setSelectedScale(null);
        setForm(emptyForm());
    };

    const openCreate = () => {
        setSelectedScale(null);
        setForm({ ...emptyForm(), criterion_id: criterionId ?? "" });
        setCrudMode("create");
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-4 inline-flex items-center gap-1 text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white"
            >
                ← Volver a Criterios
            </button>

            {/* Criterion info header */}
            {criterion && (
                <div className="mb-6 rounded-sm border border-stroke bg-white px-6 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-xs font-medium uppercase text-body dark:text-bodydark">Criterio</p>
                    <h2 className="mt-1 text-title-md2 font-semibold text-black dark:text-white">
                        {criterion.name ?? criterion.id}
                    </h2>
                    {criterion.description && (
                        <p className="mt-1 text-sm text-body dark:text-bodydark">{criterion.description}</p>
                    )}
                    {criterion.weight !== undefined && (
                        <p className="mt-1 text-sm text-body dark:text-bodydark">Peso: {criterion.weight}</p>
                    )}
                </div>
            )}

            {/* Copy scale modal */}
            <AppModal
                isOpen={isCopyModalOpen}
                onClose={closeCopyModal}
                title="Copiar escala a otros criterios"
                description={
                    <>
                        Escala origen: <span className="font-medium text-black dark:text-white">{sourceScale?.name ?? sourceScale?.id}</span>
                    </>
                }
            >
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
            </AppModal>

            {/* Page header */}
            <PageHeader
                title="Escalas"
                description={editable
                    ? "Gestiona tus escalas para este criterio. Selecciona una para asignarla."
                    : "Explora las escalas para este criterio."}
                primaryAction={{ label: "+ Nueva Escala", onClick: openCreate }}
            >
                {editable && selectedId && (
                    <button
                        onClick={handleAssignSelected}
                        className="inline-flex items-center gap-2 rounded-md bg-meta-3 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                    >
                        Asignar Seleccionado
                    </button>
                )}
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
                        <SelectableTable
                            data={scales}
                            columns={COLUMNS}
                            actions={editable ? ADMIN_TEACHER_ACTIONS : STUDENT_ACTIONS}
                            onAction={(actionName, item) => {
                                if (actionName === "select") {
                                    handleAction("select", item);
                                    return;
                                }
                                handleAction(actionName, item);
                            }}
                            selectionMode={1}
                        />
                    )}
                </div>
            </div>

            {/* CRUD panel using VerticalTextFormCard */}
            {editable && crudMode && (
                <div className="mt-6">
                    <VerticalTextFormCard
                        title={getFormTitle()}
                        description={getFormDescription()}
                        fields={getFormFields()}
                        saveLabel={getFormSaveLabel()}
                        cancelLabel="Cancelar"
                        onSave={handleFormSave}
                        onCancel={closeCrud}
                    />
                </div>
            )}

        </div>
    );
};

export default ScalesByCriterionPage;