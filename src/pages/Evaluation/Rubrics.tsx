import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import { rubricService } from "../../services/RubricService";
import { Rubric } from "../../models/Rubric";
//import securityService from "../services/segurity.service";
import { UserRole } from "../../models/user";
// TODO: Import RubricCrudPanel when available
// import RubricCrudPanel from "../components/RubricCrudPanel";
// TODO: Import useNavigate (or your router's navigate hook) when CriteriaByRubricPage is ready
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

type CrudMode = "create" | "edit" | "archive" | "delete" | null;

const COLUMNS = ["title", "description", "is_public", "is_archived", "created_at"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "edit", label: "Edit" },
    { name: "archive", label: "Archive" },
    { name: "delete", label: "Delete" },
];

const STUDENT_ACTIONS = [
    { name: "view", label: "View" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

const emptyForm = (): Omit<Rubric, "id"> => ({
    title: "",
    description: "",
    is_public: false,
    is_archived: false,
});

// ─── Component ────────────────────────────────────────────────────────────────

const RubricsPage: React.FC = () => {
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [loading, setLoading] = useState(true);
    const [crudMode, setCrudMode] = useState<CrudMode>(null);
    const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
    const [form, setForm] = useState<Omit<Rubric, "id">>(emptyForm());
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const navigate = useNavigate();

    // const user = securityService.getUser();
    // const role: UserRole = user?.role ?? "STUDENT";

    const role: UserRole = "STUDENT";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadRubrics = async () => {
        setLoading(true);
        const data = await rubricService.getRubrics();
        setRubrics(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRubrics();
    }, []);

    // ── Feedback ──────────────────────────────────────────────────────────────

    const showFeedback = (type: "success" | "error", message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 3000);
    };

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const rubric = item as Rubric;

        if (actionName === "view") {
            // TODO: Replace alert with navigation when CriteriaByRubricPage is ready.
            navigate(`/rubrics/${rubric.id}/criteria`);
            alert(`Navigate to criteria page for rubric: ${rubric.id}`);
            return;
        }

        if (actionName === "edit") {
            setSelectedRubric(rubric);
            setForm({
                title: rubric.title ?? "",
                description: rubric.description ?? "",
                is_public: rubric.is_public ?? false,
                is_archived: rubric.is_archived ?? false,
                subject_id: rubric.subject_id,
            });
            setCrudMode("edit");
        }

        if (actionName === "archive") {
            setSelectedRubric(rubric);
            setCrudMode("archive");
        }

        if (actionName === "delete") {
            setSelectedRubric(rubric);
            setCrudMode("delete");
        }
    };


    const handleSubmit = async () => {
        if (crudMode === "create") {
            const created = await rubricService.createRubric(form);
            if (created) {
                showFeedback("success", "Rubric created successfully.");
                closeCrud();
                await loadRubrics();
            } else {
                showFeedback("error", "Could not create rubric.");
            }
        }

        if (crudMode === "edit" && selectedRubric) {
            const updated = await rubricService.updateRubric(selectedRubric.id, form);
            if (updated) {
                showFeedback("success", "Rubric updated successfully.");
                closeCrud();
                await loadRubrics();
            } else {
                showFeedback("error", "Could not update rubric.");
            }
        }

        if (crudMode === "archive" && selectedRubric) {
            const success = await rubricService.archiveRubric(selectedRubric.id);
            if (success) {
                showFeedback("success", "Rubric archived successfully.");
                closeCrud();
                await loadRubrics();
            } else {
                showFeedback("error", "Could not archive rubric.");
            }
        }

        if (crudMode === "delete" && selectedRubric) {
            const success = await rubricService.deleteRubric(selectedRubric.id);
            if (success) {
                showFeedback("success", "Rubric deleted successfully.");
                closeCrud();
                await loadRubrics();
            } else {
                showFeedback("error", "Could not delete rubric. It may already be published.");
            }
        }
    };

    const closeCrud = () => {
        setCrudMode(null);
        setSelectedRubric(null);
        setForm(emptyForm());
    };

    const openCreate = () => {
        setSelectedRubric(null);
        setForm(emptyForm());
        setCrudMode("create");
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const tableData = rubrics.map((r) => ({
        ...r,
        is_public: r.is_public ? "Yes" : "No",
        is_archived: r.is_archived ? "Yes" : "No",
    }));

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Page header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-title-md2 font-semibold text-black dark:text-white">
                        Rubrics
                    </h2>
                    <p className="text-sm text-body dark:text-bodydark">
                        {editable
                            ? "Manage your rubrics: create, edit, archive or delete."
                            : "Browse available rubrics."}
                    </p>
                </div>

                {editable && (
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                    >
                        + New Rubric
                    </button>
                )}
            </div>

            {/* Feedback */}
            {feedback && (
                <div
                    className={`mb-4 rounded-md px-4 py-3 text-sm font-medium ${
                        feedback.type === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            {/* Table — scrollable, takes full height when no CRUD panel is open */}
            <div
                className={`overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark transition-all duration-300 ${
                    crudMode ? "max-h-80" : "max-h-[70vh]"
                }`}
            >
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Loading rubrics…</p>
                    ) : rubrics.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No rubrics found.</p>
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

            {/* CRUD panel — only visible for ADMIN / TEACHER */}
            {editable && crudMode && selectedRubric && (
                <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">

                    {/*
                     * TODO: Replace the placeholder below with <RubricCrudPanel /> when available.
                     *
                     * Suggested props:
                     *   <RubricCrudPanel
                     *       mode={crudMode}             // "create" | "edit" | "archive" | "delete"
                     *       rubric={selectedRubric}     // Rubric | null (null for create)
                     *       form={form}                 // form state (for create/edit)
                     *       onFormChange={setForm}      // form state setter
                     *       onSubmit={handleSubmit}     // confirm action
                     *       onClose={closeCrud}         // cancel / close panel
                     *   />
                     */}

                    {/* ── Placeholder header ── */}
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                            {crudMode === "create" && "Create Rubric"}
                            {crudMode === "edit" && `Edit Rubric: ${selectedRubric?.title ?? selectedRubric?.id}`}
                            {crudMode === "archive" && `Archive Rubric: ${selectedRubric?.title ?? selectedRubric?.id}`}
                            {crudMode === "delete" && `Delete Rubric: ${selectedRubric?.title ?? selectedRubric?.id}`}
                        </h3>
                        <button
                            onClick={closeCrud}
                            className="text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white"
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* ── Rubric info (shown for edit / archive / delete) ── */}
                    {(crudMode === "edit" || crudMode === "archive" || crudMode === "delete") && selectedRubric && (
                        <div className="mb-4 rounded-md border border-stroke bg-gray-2 px-4 py-3 text-sm dark:border-strokedark dark:bg-meta-4">
                            <p className="text-black dark:text-white"><span className="font-medium">ID:</span> {selectedRubric.id}</p>
                            <p className="text-black dark:text-white"><span className="font-medium">Title:</span> {selectedRubric.title ?? "—"}</p>
                            <p className="text-black dark:text-white"><span className="font-medium">Description:</span> {selectedRubric.description ?? "—"}</p>
                            <p className="text-black dark:text-white"><span className="font-medium">Public:</span> {selectedRubric.is_public ? "Yes" : "No"}</p>
                            <p className="text-black dark:text-white"><span className="font-medium">Archived:</span> {selectedRubric.is_archived ? "Yes" : "No"}</p>
                        </div>
                    )}

                    {/* ── Edit form ── */}
                    {crudMode === "edit" && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Title</label>
                                <input
                                    type="text"
                                    value={form.title ?? ""}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Description</label>
                                <input
                                    type="text"
                                    value={form.description ?? ""}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    checked={form.is_public ?? false}
                                    onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                                    className="h-4 w-4 accent-primary"
                                />
                                <label htmlFor="is_public" className="text-sm font-medium text-black dark:text-white">Public</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_archived"
                                    checked={form.is_archived ?? false}
                                    onChange={(e) => setForm({ ...form, is_archived: e.target.checked })}
                                    className="h-4 w-4 accent-primary"
                                />
                                <label htmlFor="is_archived" className="text-sm font-medium text-black dark:text-white">Archived</label>
                            </div>
                        </div>
                    )}

                    {/* ── Confirmation message for archive / delete ── */}
                    {crudMode === "archive" && (
                        <p className="text-sm text-body dark:text-bodydark">
                            Are you sure you want to archive this rubric? It will be unpublished and hidden.
                        </p>
                    )}
                    {crudMode === "delete" && (
                        <p className="text-sm text-red-500">
                            Are you sure you want to permanently delete this rubric? This action cannot be undone.
                        </p>
                    )}

                    {/* ── Actions ── */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleSubmit}
                            className={`rounded-md px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 ${
                                crudMode === "delete" ? "bg-red-500" : "bg-primary"
                            }`}
                        >
                            {crudMode === "create" && "Create"}
                            {crudMode === "edit" && "Save Changes"}
                            {crudMode === "archive" && "Confirm Archive"}
                            {crudMode === "delete" && "Confirm Delete"}
                        </button>
                        <button
                            onClick={closeCrud}
                            className="rounded-md border border-stroke px-5 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                        >
                            Cancel
                        </button>
                    </div>

                </div>
            )}

            {/* Create panel — no rubric selected */}
            {editable && crudMode === "create" && !selectedRubric && (
                <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black dark:text-white">Create Rubric</h3>
                        <button onClick={closeCrud} className="text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white">
                            ✕ Close
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Title</label>
                            <input
                                type="text"
                                value={form.title ?? ""}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Description</label>
                            <input
                                type="text"
                                value={form.description ?? ""}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_public_create"
                                checked={form.is_public ?? false}
                                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                                className="h-4 w-4 accent-primary"
                            />
                            <label htmlFor="is_public_create" className="text-sm font-medium text-black dark:text-white">Public</label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_archived_create"
                                checked={form.is_archived ?? false}
                                onChange={(e) => setForm({ ...form, is_archived: e.target.checked })}
                                className="h-4 w-4 accent-primary"
                            />
                            <label htmlFor="is_archived_create" className="text-sm font-medium text-black dark:text-white">Archived</label>
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleSubmit}
                            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                        >
                            Create
                        </button>
                        <button
                            onClick={closeCrud}
                            className="rounded-md border border-stroke px-5 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default RubricsPage;