import { VerticalTextFormField } from "../components/VerticalTextFormCard";
import { showToast } from "./fireToast";
import { useCrudModal } from "./useCrudModal";

type CrudMode = "create" | "edit" | null;

interface UseAcademicEntityCrudOptions<T extends { id: string }> {
    emptyForm: Omit<T, "id">;
    loadData: () => Promise<void>;
    createItem: (payload: Omit<T, "id">) => Promise<T | null>;
    updateItem: (id: string, payload: Omit<T, "id">) => Promise<T | null>;
    archiveItem?: (id: string) => Promise<T | null>;
    reactivateItem?: (id: string) => Promise<T | null>;
    buildFields: (form: Omit<T, "id">) => VerticalTextFormField[];
    mapSaveValues: (
        values: Record<string, string>,
        form: Omit<T, "id">,
        mode: CrudMode,
        selectedItem: T | null
    ) => Omit<T, "id">;
    validateSave?: (
        values: Record<string, string>,
        form: Omit<T, "id">,
        mode: CrudMode,
        selectedItem: T | null
    ) => string | null;
    onView?: (item: T) => void;
    getFormTitle: (mode: CrudMode, selectedItem: T | null) => string;
    getFormDescription?: (mode: CrudMode, selectedItem: T | null, form: Omit<T, "id">) => string;
    getArchiveConfirm?: (item: T) => string;
    getReactivateConfirm?: (item: T) => string;
    getViewMessage?: (item: T) => string;
    successMessages: {
        create: string;
        update: string;
        archive?: string;
        reactivate?: string;
    };
    errorMessages: {
        create: string;
        update: string;
        archive?: string;
        reactivate?: string;
        validation?: string;
        invalidSelection?: string;
    };
}

export function useAcademicEntityCrud<T extends { id: string }>(
    options: UseAcademicEntityCrudOptions<T>
) {
    const {
        crudMode,
        selectedItem,
        form,
        setForm,
        resetCrud,
        startCreate,
        startEdit,
    } = useCrudModal<T>(options.emptyForm);

    const isOpen = crudMode !== null;
    const title = options.getFormTitle(crudMode, selectedItem);
    const description = options.getFormDescription?.(crudMode, selectedItem, form) ?? "";
    const fields = options.buildFields(form);
    const saveLabel = crudMode === "create" ? "Crear" : "Guardar Cambios";

    const close = () => {
        resetCrud();
    };

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const entity = item as T;

        if (actionName === "view") {
            if (options.onView) {
                options.onView(entity);
                return;
            }
            if (options.getViewMessage) {
                showToast("Información", options.getViewMessage(entity), 1);
            }
            return;
        }

        if (actionName === "edit") {
            startEdit(entity);
            return;
        }

        if (actionName === "archive" && options.archiveItem && options.getArchiveConfirm) {
            void handleArchive(entity);
            return;
        }

        if (actionName === "reactivate" && options.reactivateItem && options.getReactivateConfirm) {
            void handleReactivate(entity);
            return;
        }
    };

    const handleArchive = async (entity: T) => {
        if (!options.archiveItem || !options.getArchiveConfirm) return;

        const ok = window.confirm(options.getArchiveConfirm(entity));
        if (!ok) return;

        try {
            const success = await options.archiveItem(entity.id);
            if (success) {
                showToast("Éxito", options.successMessages.archive ?? "Operación completada exitosamente.", 0);
                close();
                await options.loadData();
            } else {
                showToast("Error", options.errorMessages.archive ?? "No se pudo completar la operación.", 2);
            }
        } catch (err: any) {
            const message = err?.message || options.errorMessages.archive || 'No se pudo completar la operación.';
            showToast('Error', message, 2);
        }
    };

    const handleReactivate = async (entity: T) => {
        if (!options.reactivateItem || !options.getReactivateConfirm) return;

        const ok = window.confirm(options.getReactivateConfirm(entity));
        if (!ok) return;

        try {
            const success = await options.reactivateItem(entity.id);
            if (success) {
                showToast("Éxito", options.successMessages.reactivate ?? "Operación completada exitosamente.", 0);
                close();
                await options.loadData();
            } else {
                showToast("Error", options.errorMessages.reactivate ?? "No se pudo completar la operación.", 2);
            }
        } catch (err: any) {
            const message = err?.message || options.errorMessages.reactivate || 'No se pudo completar la operación.';
            showToast('Error', message, 2);
        }
    };

    const handleSave = async (values: Record<string, string>) => {
        const validationError = options.validateSave?.(values, form, crudMode, selectedItem);
        if (validationError) {
            showToast("Error", validationError, 2);
            return;
        }

        const nextForm = options.mapSaveValues(values, form, crudMode, selectedItem);
        setForm(nextForm);

        try {
            if (crudMode === "create") {
                const created = await options.createItem(nextForm);
                if (created) {
                    showToast("Éxito", options.successMessages.create, 0);
                    close();
                    await options.loadData();
                } else {
                    close();
                    showToast("Error", options.errorMessages.create, 2);
                }
                return;
            }

            if (crudMode === "edit" && selectedItem) {
                const updated = await options.updateItem(selectedItem.id, nextForm);
                if (updated) {
                    showToast("Éxito", options.successMessages.update, 0);
                    close();
                    await options.loadData();
                } else {
                    close();
                    showToast("Error", options.errorMessages.update, 2);
                }
                return;
            }

            if (crudMode === "edit" && !selectedItem) {
                showToast(
                    "Error",
                    options.errorMessages.invalidSelection ?? "No se pudo identificar el elemento a editar.",
                    2
                );
            }
        } catch (error: any) {
            const toastMessage = error?.message || (crudMode === "create"
                ? options.errorMessages.create
                : options.errorMessages.update);
            close();
            showToast("Error", toastMessage, 2);
        }
    };

    return {
        crudMode,
        selectedItem,
        form,
        setForm,
        resetCrud,
        startCreate,
        startEdit,
        isOpen,
        close,
        handleAction,
        handleSave,
        title,
        description,
        fields,
        saveLabel,
    };
}