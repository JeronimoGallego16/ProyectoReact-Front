import React, { useEffect, useState } from "react";
import SelectableTable from "../../components/SelectableTable";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import { rubricService } from "../../services/RubricService";
import { Rubric } from "../../models/Rubric";
import { Criterion } from "../../models/Criterion";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
import { useNavigate, useParams } from "react-router-dom";
import { showToast } from "../../hooks/fireToast";

// ─── Types ────────────────────────────────────────────────────────────────────

type CrudMode = "create" | "edit" | null;

const COLUMNS = ["name", "description", "weight"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "edit", label: "Editar" },
    { name: "delete", label: "Eliminar" },
    { name: "view", label: "Ver Escalas" },
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
    const onBack = () => navigate("/rubrics");

    const [rubric, setRubric] = useState<Rubric | null>(null);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [crudMode, setCrudMode] = useState<CrudMode>(null);
    const [selectedCriterion, setSelectedCriterion] = useState<Criterion | null>(null);
    const [form, setForm] = useState<Omit<Criterion, "id">>(emptyForm());

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadData = async () => {
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
        loadData();
    }, [rubricId]);

    // ── Selection ─────────────────────────────────────────────────────────────

    const toggleSelection = (criterionId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(criterionId) ? next.delete(criterionId) : next.add(criterionId);
            return next;
        });
    };

    const handleAssignSelected = async () => {
        if (selectedIds.size === 0) {
            showToast("Error", "No hay un criterio seleccionado.", 2);
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            const response = await rubricService.updateCriterion(id, { rubric_id: rubricId });
            const updated = response.data;
            updated ? successCount++ : failCount++;
        }

        if (successCount > 0) {
            showToast(
                failCount === 0 ? "Éxito" : "Error",
                `${successCount} criterio(s) asignado(s).${failCount > 0 ? ` ${failCount} error.` : ""}`,
                failCount === 0 ? 0 : 2
            );
            setSelectedIds(new Set());
            await loadData();
        } else {
            showToast("Error", "No se pudo asignar ningún criterio a esta rúbrica.", 2);
        }
    };

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const criterion = item as Criterion;

        if (actionName === "view") {
            navigate(`/criteria/${criterion.id}/scales`);
            return;
        }

        if (actionName === "edit") {
            if (rubric?.is_public) {
                showToast("Error", "No puedes editar criterios de una rúbrica publicada. Archívala primero.", 2);
                return;
            }
            setSelectedCriterion(criterion);
            setForm({
                rubric_id: criterion.rubric_id ?? rubricId,
                name: criterion.name ?? "",
                description: criterion.description ?? "",
                weight: criterion.weight ?? 0,
            });
            setCrudMode("edit");
        }

        if (actionName === "delete") {
            if (rubric?.is_public) {
                showToast("Error", "No puedes eliminar criterios de una rúbrica publicada. Archívala primero.", 2);
                return;
            }
            void handleDelete(criterion);
        }
    };

    const handleDelete = async (criterion: Criterion) => {
        const ok = window.confirm(`¿Eliminar el criterio "${criterion.name}"? Esta acción no se puede deshacer.`);
        if (!ok) return;

        const response = await rubricService.deleteCriterion(criterion.id);
        if (!response.error) {
            showToast("Éxito", "Criterio eliminado exitosamente.", 0);
            await loadData();
        } else {
            showToast("Error", response.error || "No se pudo eliminar el criterio.", 2);
        }
    };

    const handleSubmit = async (submittedForm?: Omit<Criterion, "id">) => {
        const currentForm = submittedForm ?? form;

        if (crudMode === "create") {
            const payload = { ...currentForm, rubric_id: rubricId } as Omit<Criterion, "id">;
            const response = await rubricService.createCriterion(payload);
            const created = response.data;
            if (created) {
                showToast("Éxito", "Criterio creado exitosamente.", 0);
                closeCrud();
                await loadData();
            } else {
                showToast("Error", response.error || "No se pudo crear el criterio. Verifique que la suma de pesos no exceda 100.", 2);
            }
            return;
        }

        if (crudMode === "edit" && selectedCriterion) {
            const response = await rubricService.updateCriterion(selectedCriterion.id, {
                name: currentForm.name,
                description: currentForm.description,
                weight: currentForm.weight,
            });
            const updated = response.data;
            if (updated) {
                showToast("Éxito", "Criterio actualizado exitosamente.", 0);
                closeCrud();
                await loadData();
            } else {
                showToast("Error", response.error || "No se pudo actualizar el criterio.", 2);
            }
        }
    };

    const closeCrud = () => {
        setCrudMode(null);
        setSelectedCriterion(null);
        setForm(emptyForm());
    };

    const openCreate = () => {
        setSelectedCriterion(null);
        setForm({ ...emptyForm(), rubric_id: rubricId });
        setCrudMode("create");
    };

    // ── Helper functions for VerticalTextFormCard ──────────────────────────────

    const getFormTitle = (): string => {
        if (crudMode === "create") return "Crear Criterio";
        if (crudMode === "edit") return `Editar Criterio`;
        return "";
    };

    const getFormDescription = (): string => {
        if (selectedCriterion && crudMode === "edit") {
            return `Nombre: ${selectedCriterion.name} - Peso: ${selectedCriterion.weight}`;
        }
        return "";
    };

    const getFormFields = (): VerticalTextFormField[] => {
        return [
            {
                name: "name",
                label: "Nombre",
                placeholder: "Ingrese el nombre del criterio",
                type: "text",
                value: form.name,
            },
            {
                name: "description",
                label: "Descripción",
                placeholder: "Ingrese la descripción del criterio",
                kind: "textarea",
                rows: 3,
                value: form.description,
            },
            {
                name: "weight",
                label: "Peso",
                placeholder: "Ingrese el peso del criterio (0-100)",
                type: "number",
                value: String(form.weight),
            },
        ];
    };

    const getFormSaveLabel = (): string => {
        if (crudMode === "create") return "Crear";
        if (crudMode === "edit") return "Guardar Cambios";
        return "Guardar";
    };

    const handleFormSave = (values: Record<string, string>) => {
        const nextForm: Omit<Criterion, "id"> = {
            ...form,
            name: values.name ?? form.name,
            description: values.description ?? form.description,
            weight: Number(values.weight) || 0,
        };

        setForm(nextForm);
        void handleSubmit(nextForm);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Back button */}
            <button
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-1 text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white"
            >
                ← Volver a Rúbricas
            </button>

            {/* Rubric info header */}
            {rubric && (
                <div className="mb-6 rounded-sm border border-stroke bg-white px-6 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h2 className="mt-1 text-title-md2 font-semibold text-black dark:text-white">
                        {rubric.title ?? rubric.id}
                    </h2>
                    {rubric.description && (
                        <p className="mt-1 text-sm text-body dark:text-bodydark">{rubric.description}</p>
                    )}
                </div>
            )}

            {/* Page header */}
            <PageHeader
                title="Criterios"
                description={editable
                    ? "Gestiona tus criterios para esta rúbrica. Asigna, crea, edita y elimina."
                    : "Busca y navega por los criterios de esta rúbrica."}
                primaryAction={{ label: "+ Nuevo Criterio", onClick: openCreate }}
            >
                {editable && selectedIds.size > 0 && (
                    <button
                        onClick={handleAssignSelected}
                        className="inline-flex items-center gap-2 rounded-md bg-meta-3 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                    >
                        Asignar seleccionados ({selectedIds.size})
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
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando criterios…</p>
                    ) : criteria.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron criterios para esta rúbrica.</p>
                    ) : (
                        <SelectableTable
                            data={criteria}
                            columns={COLUMNS}
                            actions={editable ? ADMIN_TEACHER_ACTIONS : STUDENT_ACTIONS}
                            onAction={(actionName, item) => {
                                if (actionName === "select") {
                                    toggleSelection((item as Criterion).id);
                                    return;
                                }
                                handleAction(actionName, item);
                            }}
                            selectionMode={2}
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

export default CriteriaByRubricPage;