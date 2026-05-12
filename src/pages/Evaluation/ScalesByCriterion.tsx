import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SelectableTable from "../../components/SelectableTable";
import { rubricService } from "../../services/RubricService";
import { Criterion } from "../../models/Criterion";
import { Scale } from "../../models/Scale";
import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
// TODO: Import ScaleCrudPanel when available
// import ScaleCrudPanel from "../components/ScaleCrudPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

type CrudMode = "create" | "edit" | "delete" | null;

const COLUMNS = ["name", "description", "value"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "edit", label: "Edit" },
    { name: "delete", label: "Delete" },
];

// Students have no actions — table is read-only, radio is visual only
const STUDENT_ACTIONS: { name: string; label: string }[] = [];

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
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const user = securityService.getUser();
    const role: UserRole = user?.role ?? "STUDENT";
    //const role: UserRole = "ADMIN";
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

    // ── Feedback ──────────────────────────────────────────────────────────────

    const showFeedback = (type: "success" | "error", message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 3000);
    };

    // ── Selection (radio — single) ────────────────────────────────────────────

    const handleAssignSelected = async () => {
        if (!selectedId || !criterionId) {
            showFeedback("error", "No scale selected.");
            return;
        }

        const response = await rubricService.updateScale(selectedId, { criterion_id: criterionId });
        const updated = response.data;
        if (updated) {
            showFeedback("success", "Scale assigned to criterion successfully.");
            setSelectedId(null);
            await loadData();
        } else {
            showFeedback("error", "Could not assign scale to criterion.");
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
            setSelectedScale(scale);
            setCrudMode("delete");
        }
    };

    const handleSubmit = async () => {
        if (crudMode === "create") {
            const response = await rubricService.createScale({ ...form, criterion_id: criterionId ?? "" });
            const created = response.data;
            if (created) {
                showFeedback("success", "Scale created successfully.");
                closeCrud();
                await loadData();
            } else {
                showFeedback("error", "Could not create scale.");
            }
        }

        if (crudMode === "edit" && selectedScale) {
            const response = await rubricService.updateScale(selectedScale.id, form);
            const updated = response.data;
            if (updated) {
                showFeedback("success", "Scale updated successfully.");
                closeCrud();
                await loadData();
            } else {
                showFeedback("error", "Could not update scale.");
            }
        }

        if (crudMode === "delete" && selectedScale) {
            // RubricService does not expose deleteScale yet.
            // TODO: Call rubricService.deleteScale(selectedScale.id) when available.
            // For now we unassign the scale from the criterion by clearing criterion_id.
            const response = await rubricService.updateScale(selectedScale.id, { criterion_id: undefined });
            const updated = response.data;
            if (updated) {
                showFeedback("success", "Scale removed from criterion.");
                closeCrud();
                await loadData();
            } else {
                showFeedback("error", "Could not remove scale.");
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

    // ── Table data ────────────────────────────────────────────────────────────

    const tableData = scales.map((s) => ({ ...s }));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-4 inline-flex items-center gap-1 text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white"
            >
                ← Back to Criteria
            </button>

            {/* Criterion info header */}
            {criterion && (
                <div className="mb-6 rounded-sm border border-stroke bg-white px-6 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-xs font-medium uppercase text-body dark:text-bodydark">Criterion</p>
                    <h2 className="mt-1 text-title-md2 font-semibold text-black dark:text-white">
                        {criterion.name ?? criterion.id}
                    </h2>
                    {criterion.description && (
                        <p className="mt-1 text-sm text-body dark:text-bodydark">{criterion.description}</p>
                    )}
                    {criterion.weight !== undefined && (
                        <p className="mt-1 text-sm text-body dark:text-bodydark">Weight: {criterion.weight}</p>
                    )}
                </div>
            )}

            {/* Page header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white">Scales</h3>
                    <p className="text-sm text-body dark:text-bodydark">
                        {editable
                            ? "Manage scales for this criterion. Select one to assign it."
                            : "Browse scales for this criterion."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {editable && selectedId && (
                        <button
                            onClick={handleAssignSelected}
                            className="inline-flex items-center gap-2 rounded-md bg-meta-3 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                        >
                            Assign selected
                        </button>
                    )}
                    {editable && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                        >
                            + New Scale
                        </button>
                    )}
                </div>
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

            {/* Table */}
            <div
                className={`overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark transition-all duration-300 ${
                    crudMode ? "max-h-80" : "max-h-[60vh]"
                }`}
            >
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Loading scales…</p>
                    ) : scales.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No scales found for this criterion.</p>
                    ) : (
                        <SelectableTable
                            data={tableData}
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

            {/* CRUD panel — only visible for ADMIN / TEACHER, action on existing scale */}
            {editable && crudMode && selectedScale && (
                <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">

                    {/*
                     * TODO: Replace the placeholder below with <ScaleCrudPanel /> when available.
                     *
                     * Suggested props:
                     *   <ScaleCrudPanel
                     *       mode={crudMode}              // "create" | "edit" | "delete"
                     *       scale={selectedScale}        // Scale | null (null for create)
                     *       criterionId={criterionId}    // to pre-fill criterion_id on create
                     *       form={form}
                     *       onFormChange={setForm}
                     *       onSubmit={handleSubmit}
                     *       onClose={closeCrud}
                     *   />
                     */}

                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                            {crudMode === "edit" && `Edit Scale: ${selectedScale?.name ?? selectedScale?.id}`}
                            {crudMode === "delete" && `Remove Scale: ${selectedScale?.name ?? selectedScale?.id}`}
                        </h3>
                        <button
                            onClick={closeCrud}
                            className="text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white"
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* Scale info */}
                    <div className="mb-4 rounded-md border border-stroke bg-gray-2 px-4 py-3 text-sm dark:border-strokedark dark:bg-meta-4">
                        <p className="text-black dark:text-white"><span className="font-medium">ID:</span> {selectedScale.id}</p>
                        <p className="text-black dark:text-white"><span className="font-medium">Name:</span> {selectedScale.name ?? "—"}</p>
                        <p className="text-black dark:text-white"><span className="font-medium">Description:</span> {selectedScale.description ?? "—"}</p>
                        <p className="text-black dark:text-white"><span className="font-medium">Value:</span> {selectedScale.value ?? "—"}</p>
                    </div>

                    {/* Edit form */}
                    {crudMode === "edit" && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Name</label>
                                <input
                                    type="text"
                                    value={form.name ?? ""}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                            <div>
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Value</label>
                                <input
                                    type="number"
                                    value={form.value ?? 0}
                                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Delete confirmation */}
                    {crudMode === "delete" && (
                        <p className="text-sm text-red-500">
                            Are you sure you want to remove this scale from the criterion?
                        </p>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleSubmit}
                            className={`rounded-md px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90 ${
                                crudMode === "delete" ? "bg-red-500" : "bg-primary"
                            }`}
                        >
                            {crudMode === "edit" && "Save Changes"}
                            {crudMode === "delete" && "Confirm Remove"}
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

            {/* Create panel — no scale selected */}
            {editable && crudMode === "create" && !selectedScale && (
                <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black dark:text-white">Create Scale</h3>
                        <button onClick={closeCrud} className="text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white">
                            ✕ Close
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Name</label>
                            <input
                                type="text"
                                value={form.name ?? ""}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                        <div>
                            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Value</label>
                            <input
                                type="number"
                                value={form.value ?? 0}
                                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                                className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                            />
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

export default ScalesByCriterionPage;
