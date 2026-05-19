import { VerticalTextFormField } from "../components/VerticalTextFormCard";
import { showToast } from "./fireToast";
import { useCrudModal } from "./useCrudModal";

type CrudMode = "create" | "edit" | null;

interface UseEntityCrudOptions<T extends { id: string }> {
    emptyForm: Omit<T, "id">;
    loadData: (params?: Record<string, any>) => Promise<void>;
    createItem: (payload: Omit<T, "id">) => Promise<T | null>;
    updateItem: (id: string, payload: Omit<T, "id">) => Promise<T | null>;
    deleteOrArchive?: (id: string, type: "delete" | "archive" | "publish") => Promise<boolean>;
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
    getFormTitle: (mode: CrudMode, selectedItem: T | null) => string;
    getFormDescription?: (mode: CrudMode, selectedItem: T | null, form: Omit<T, "id">) => string;
    getConfirmMessage?: (type: "delete" | "archive" | "publish", item: T) => string;
    /**
     * Optional custom confirm function that returns a Promise<boolean>.
     * If provided, it will be used instead of `window.confirm` so pages can show a modal.
     */
    confirmWith?: (message: string) => Promise<boolean>;
    successMessages: {
        create: string;
        update: string;
        delete?: string;
        archive?: string;
        publish?: string;
    };
    errorMessages: {
        create: string;
        update: string;
        delete?: string;
        archive?: string;
        publish?: string;
        validation?: string;
        invalidSelection?: string;
    };
    onAction?: (actionName: string, item: T) => void | Promise<void>;
}

export function useEntityCrud<T extends { id: string }>(
    options: UseEntityCrudOptions<T>
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

    const handleAction = async (actionName: string, item: Record<string, any>) => {
        const entity = item as T;

        if (
            actionName === "view" ||
            actionName === "grade" ||
            actionName === "calify" ||
            actionName.startsWith("navigate")
        ) {
            if (options.onAction) {
                await options.onAction(actionName, entity);
            }
            return;
        }

        if (actionName === "edit") {
            startEdit(entity);
            return;
        }

        if (actionName === "delete" && options.deleteOrArchive) {
            await handleDeletionAction(entity, "delete");
        }

        if (actionName === "archive" && options.deleteOrArchive) {
            await handleDeletionAction(entity, "archive");
        }

        if (actionName === "publish" && options.deleteOrArchive) {
            await handleDeletionAction(entity, "publish");
        }
    };

    const handleDeletionAction = async (entity: T, type: "delete" | "archive" | "publish") => {
        if (!options.deleteOrArchive || !options.getConfirmMessage) return;
        const confirmMessage = options.getConfirmMessage(type, entity);
        const ok = options.confirmWith ? await options.confirmWith(confirmMessage) : window.confirm(confirmMessage);
        if (!ok) return;

        const success = await options.deleteOrArchive(entity.id, type);
        if (success) {
            const messageType = `${type}` as "delete" | "archive" | "publish";
            const successMsg = options.successMessages[messageType] ?? "Operación completada exitosamente.";
            showToast("Éxito", successMsg, 0);
            close();
            await options.loadData();
        } else {
            const messageType = `${type}` as "delete" | "archive" | "publish";
            const errorMsg = options.errorMessages[messageType] ?? "No se pudo completar la operación.";
            showToast("Error", errorMsg, 2);
        }
    };

    const handleSave = async (values: Record<string, string>) => {
        const validationError = options.validateSave?.(values, form, crudMode, selectedItem);
        if (validationError) {
            close();
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
        isOpen,
        close,
        handleAction,
        handleSave,
        startCreate,
        startEdit,
        title,
        description,
        fields,
        saveLabel,
    };
}
