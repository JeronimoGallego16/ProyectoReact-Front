import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import PageHeader from "../../components/PageHeader";
import EntityHeader from "../../components/EntityHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import ModalLauncher from "../../components/ModalLauncher";
import { rubricService } from "../../services/RubricService";
import { criterionService } from "../../services/CriterionService";
import { Rubric } from "../../models/Rubric";
import { Criterion } from "../../models/Criterion";
import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/User";
import { useNavigate, useParams } from "react-router-dom";
import { showToast } from "../../hooks/fireToast";
import { useCrudModal } from "../../hooks/useCrudModal";

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
    const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
    
    const {
            crudMode,
            selectedItem: selectedCriterion,
            form,
            setForm,
            resetCrud,
            startCreate,
            startEdit,
        } = useCrudModal<Criterion>(emptyForm());

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
            criterionService.getCriteriaByRubricId(rubricId),
        ]);
        setRubric(rubricResponse.data || null);
        setCriteria(Array.isArray(criteriaResponse.data) ? criteriaResponse.data : []);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [rubricId]);

    // (Selection removed — using GenericTable for consistency with Rubrics)

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
            startEdit(criterion);
            setIsCrudModalOpen(true);
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

        const response = await criterionService.deleteCriterion(criterion.id);
        if (!response.error) {
            showToast("Éxito", "Criterio eliminado exitosamente.", 0);
            await loadData();
        } else {
            showToast("Error", response.error || "No se pudo eliminar el criterio.", 2);
        }
    };

    const closeCrudModal = () => {
        setIsCrudModalOpen(false);
        resetCrud();
    };

    const handleSubmit = async (submittedForm?: Omit<Criterion, "id">) => {
        const currentForm = submittedForm ?? form;

        if (crudMode === "create") {
            const payload = { ...currentForm, rubric_id: rubricId } as Omit<Criterion, "id">;
            const response = await criterionService.createCriterion(payload);
            const created = response.data;
            if (created) {
                showToast("Éxito", "Criterio creado exitosamente.", 0);
                closeCrudModal();
                await loadData();
            } else {
                closeCrudModal();
                showToast("Error", response.error || "No se pudo crear el criterio. Verifique que la suma de pesos no exceda 100.", 2);
            }
            return;
        }

        if (crudMode === "edit" && selectedCriterion) {
            const response = await criterionService.updateCriterion(selectedCriterion.id, {
                name: currentForm.name,
                description: currentForm.description,
                weight: currentForm.weight,
            });
            const updated = response.data;
            if (updated) {
                showToast("Éxito", "Criterio actualizado exitosamente.", 0);
                closeCrudModal();
                await loadData();
            } else {
                closeCrudModal();
                showToast("Error", response.error || "No se pudo actualizar el criterio.", 2);
            }
        }
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
        const newWeight = Number(values.weight) || 0;

        // Validar rango del peso
        if (newWeight < 0 || newWeight > 100) {
            closeCrudModal();
            showToast("Error", "El peso debe estar entre 0 y 100.", 2);
            return;
        }

        // Calcular suma después del cambio (restando el peso actual si estamos editando)
        const currentTotal = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
        let totalAfter = currentTotal;
        if (crudMode === "edit" && selectedCriterion) {
            totalAfter = currentTotal - (Number(selectedCriterion.weight) || 0) + newWeight;
        } else {
            totalAfter = currentTotal + newWeight;
        }

        if (totalAfter > 100) {
            closeCrudModal();
            showToast("Error", "La suma total de pesos excede 100. Ajusta el peso antes de guardar.", 2);
            return;
        }

        const nextForm: Omit<Criterion, "id"> = {
            ...form,
            name: values.name ?? form.name,
            description: values.description ?? form.description,
            weight: newWeight,
        };

        setForm(nextForm);
        void handleSubmit(nextForm);
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
                primaryAction={{ label: "+ Nuevo Criterio", onClick: () => { startCreate(); setIsCrudModalOpen(true); } }}
            >
            </PageHeader>

            {/* Nota sobre pesos */}
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

            {/* Table — full height */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[60vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando criterios…</p>
                    ) : criteria.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron criterios para esta rúbrica.</p>
                    ) : (
                        <GenericTable
                            data={criteria}
                            columns={COLUMNS}
                            actions={editable ? ADMIN_TEACHER_ACTIONS : STUDENT_ACTIONS}
                            onAction={handleAction}
                        />
                    )}
                </div>
            </div>

            {/* CRUD modal using ModalLauncher */}
            {editable && crudMode && (
                <ModalLauncher
                    isOpen={isCrudModalOpen}
                    onClose={() => { setIsCrudModalOpen(false); resetCrud(); }}
                >
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

export default CriteriaByRubricPage;