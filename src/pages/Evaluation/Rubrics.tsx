import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import TableScroll from "../../components/TableScroll";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard, { VerticalTextFormField } from "../../components/VerticalTextFormCard";
import ModalLauncher from "../../components/ModalLauncher";
import { rubricService } from "../../services/RubricService";
import { Rubric } from "../../models/Rubric";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
import { useNavigate } from "react-router-dom";
import { useEntityCrud } from "../../hooks/useEntityCrud";

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
    const navigate = useNavigate();

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

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
            return response.data ?? null;
        },
        updateItem: async (id, payload) => {
            const response = await rubricService.updateRubric(id, payload);
            return response.data ?? null;
        },
        deleteOrArchive: async (id, type) => {
            let response;
            if (type === "delete") {
                response = await rubricService.deleteRubric(id);
            } else if (type === "archive") {
                response = await rubricService.archiveRubric(id);
            } else if (type === "publish") {
                response = await rubricService.publishRubric(id);
            }
            return !response?.error;
        },
        buildFields: (f) => getFormFields(f),
        mapSaveValues: (values) => ({
            title: values.title,
            description: values.description,
        }),
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
                primaryAction={editable ? {
                    label: "+ Nueva Rúbrica",
                    onClick: startCreate,
                } : undefined}
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