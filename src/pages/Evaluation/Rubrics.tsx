import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import ModalLauncher from "../../components/ModalLauncher";
import { rubricService } from "../../services/RubricService";
import { Rubric } from "../../models/Rubric";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../hooks/fireToast";
import { useCrudModal } from "../../hooks/useCrudModal";

// ─── Types ────────────────────────────────────────────────────────────────────

const COLUMNS = ["title", "description", "is_public", "is_archived"];

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
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
    const {
        crudMode,
        selectedItem: selectedRubric,
        form,
        setForm,
        resetCrud,
        startCreate,
        startEdit,
    } = useCrudModal<Rubric>(emptyForm());
    
    const navigate = useNavigate();

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadRubrics = async () => {
        setLoading(true);
        const response = await rubricService.getRubrics();
        const data = Array.isArray(response.data) ? response.data : [];
        setRubrics(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRubrics();
    }, []);

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const rubric = rubrics.find((currentRubric) => currentRubric.id === item.id) ?? (item as Rubric);

        if (actionName === "view") {
            navigate(`/rubrics/${rubric.id}/criteria`);
            return;
        }

        if (actionName === "edit") {
            startEdit(rubric);
            setIsCrudModalOpen(true);
        }

        if (actionName === "delete") {
            void handleDelete(rubric);
        }

        if (actionName === "archive") {
            void handleArchive(rubric);
        }

        if (actionName === "publish") {
            void handlePublish(rubric);
        }
    };

    const handleDelete = async (rubric: Rubric) => {
        const ok = window.confirm(`Eliminar la rúbrica "${rubric.title ?? rubric.id}"? Esta acción no se puede deshacer.`);
        if (!ok) return;

        const response = await rubricService.deleteRubric(rubric.id);
        if (!response.error) {
            showToast("Éxito", "Rúbrica eliminada exitosamente.", 0);
            await loadRubrics();
        } else {
            showToast("Error", response.error || "No se pudo eliminar la rúbrica. Puede que ya esté publicada.", 2);
        }
    };

    const handleArchive = async (rubric: Rubric) => {
        const ok = window.confirm(`Archivar la rúbrica "${rubric.title ?? rubric.id}"? Se despublicará y quedará archivada.`);
        if (!ok) return;

        const response = await rubricService.archiveRubric(rubric.id);
        if (!response.error) {
            showToast("Éxito", "Rúbrica archivada exitosamente.", 0);
            await loadRubrics();
        } else {
            showToast("Error", response.error || "No se pudo archivar la rúbrica.", 2);
        }
    };

    const handlePublish = async (rubric: Rubric) => {
        const ok = window.confirm(`Publicar la rúbrica "${rubric.title ?? rubric.id}"? Verifica que tenga los criterios necesarios.`);
        if (!ok) return;

        const response = await rubricService.publishRubric(rubric.id);
        if (!response.error) {
            showToast("Éxito", "Rúbrica publicada exitosamente.", 0);
            await loadRubrics();
        } else {
            showToast("Error", response.error || "No se pudo publicar la rúbrica.", 2);
        }
    };

    // ── Helper functions for VerticalTextFormCard ──────────────────────────────

    const getFormTitle = (): string => {
        if (crudMode === "create") return "Crear Rúbrica";
        if (crudMode === "edit") return `Editar Rúbrica`;
        return "";
    };

    const getFormDescription = (): string => {
        if (selectedRubric && crudMode === "edit") {
            return `Título: ${selectedRubric.title ?? "—"}`;
        }
        return "";
    };

    const getFormFields = (): VerticalTextFormField[] => {
        const baseFields: VerticalTextFormField[] = [
            {
                name: "title",
                label: "Título",
                placeholder: "Ingrese el título de la rúbrica",
                type: "text",
                value: form.title,
            },
            {
                name: "description",
                label: "Descripción",
                placeholder: "Ingrese la descripción de la rúbrica",
                kind: "textarea",
                rows: 3,
                value: form.description,
            },
        ];

        return baseFields;
    };

    const getFormSaveLabel = (): string => {
        if (crudMode === "create") return "Crear";
        if (crudMode === "edit") return "Guardar Cambios";
        return "Guardar";
    };

    const handleFormSave = async (values: Record<string, string>) => {
        const nextForm: Omit<Rubric, "id"> = {
            title: values.title ?? form.title,
            description: values.description ?? form.description,
        };

        setForm(nextForm);

        if (crudMode === "create") {
            const response = await rubricService.createRubric(nextForm);
            if (response.data) {
                showToast("Éxito", "Rúbrica creada exitosamente.", 0);
                setIsCrudModalOpen(false);
                resetCrud();
                await loadRubrics();
            } else {
                showToast("Error", "No se pudo crear la rúbrica.", 2);
            }
            return;
        }

        if (crudMode === "edit" && selectedRubric) {
            const response = await rubricService.updateRubric(selectedRubric.id, nextForm);
            if (response.data) {
                showToast("Éxito", "Rúbrica actualizada exitosamente.", 0);
                setIsCrudModalOpen(false);
                resetCrud();
                await loadRubrics();
            } else {
                showToast("Error", "No se pudo actualizar la rúbrica.", 2);
            }
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const tableData = rubrics.map((r) => ({
        ...r,
        is_public: r.is_public ? "Sí" : "No",
        is_archived: r.is_archived ? "Sí" : "No",
    }));

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Page header */}
            <PageHeader
                title="Rúbricas"
                description={editable
                    ? "Gestiona tus rúbricas: crea, edita, archiva o elimina"
                    : "Busca y navega por las rúbricas disponibles."}
                primaryAction={{ label: "+ Nueva Rúbrica", onClick: () => { startCreate(); setIsCrudModalOpen(true); } }}
            />

            {/* Table — full height */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando rúbricas…</p>
                    ) : rubrics.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron rúbricas.</p>
                    ) : (
                        <GenericTable
                            data={tableData}
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

export default RubricsPage;