import React, { useEffect, useState } from "react";
import SelectableTable from "../../components/SelectableTable";
import { rubricService } from "../../services/RubricService";
import { Rubric } from "../../models/Rubric";
import { Criterion } from "../../models/Criterion";
//import securityService from "../services/segurity.service";
import { UserRole } from "../../models/user";
import { useNavigate, useParams } from "react-router-dom";
// TODO: Import CriterionCrudPanel when available
// import CriterionCrudPanel from "../components/CriterionCrudPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

type CrudMode = "create" | "edit" | "delete" | null;

const COLUMNS = ["name", "description", "weight"];

const ADMIN_TEACHER_ACTIONS = [
    { name: "edit", label: "Edit" },
    { name: "delete", label: "Delete" },
    { name: "view", label: "View Scales" },
];

const STUDENT_ACTIONS = [
    { name: "view", label: "View Scales" },
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

interface CriteriaByRubricPageProps {
    // TODO: When using a router, remove this prop and read rubricId from useParams() instead.
    rubricId: string;
    onBack: () => void;
}

const CriteriaByRubricPage: React.FC<CriteriaByRubricPageProps> = () => {
    
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
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // const user = securityService.getUser();
    // const role: UserRole = user?.role ?? "STUDENT";
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

    // ── Feedback ──────────────────────────────────────────────────────────────

    const showFeedback = (type: "success" | "error", message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 3000);
    };

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
            showFeedback("error", "No criteria selected.");
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
            showFeedback(
                failCount === 0 ? "success" : "error",
                `${successCount} criterion(a) assigned.${failCount > 0 ? ` ${failCount} failed.` : ""}`
            );
            setSelectedIds(new Set());
            await loadData();
        } else {
            showFeedback("error", "Could not assign any criteria to this rubric.");
        }
    };

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const criterion = item as Criterion;

        if (actionName === "view") {
            navigate(`/criteria/${criterion.id}/scales`);
            alert(`Navigate to scales page for criterion: ${criterion.id}`);
            return;
        }

        if (actionName === "edit") {
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
            setSelectedCriterion(criterion);
            setCrudMode("delete");
        }
    };

    const handleSubmit = async () => {
        if (crudMode === "create") {
            const response = await rubricService.createCriterion({ ...form, rubric_id: rubricId });
            const created = response.data;
            if (created) {
                showFeedback("success", "Criterion created successfully.");
                closeCrud();
                await loadData();
            } else {
                showFeedback("error", "Could not create criterion. Check that the weight total does not exceed 100.");
            }
        }

        if (crudMode === "edit" && selectedCriterion) {
            const response = await rubricService.updateCriterion(selectedCriterion.id, form);
            const updated = response.data;
            if (updated) {
                showFeedback("success", "Criterion updated successfully.");
                closeCrud();
                await loadData();
            } else {
                showFeedback("error", "Could not update criterion.");
            }
        }

        if (crudMode === "delete" && selectedCriterion) {
            // RubricService does not expose deleteCriterion yet.
            // TODO: Call rubricService.deleteCriterion(selectedCriterion.id) when available.
            // For now we unassign the criterion from the rubric by clearing rubric_id.
            const response = await rubricService.updateCriterion(selectedCriterion.id, { rubric_id: undefined });
            const updated = response.data;
            if (updated) {
                showFeedback("success", "Criterion removed from rubric.");
                closeCrud();
                await loadData();
            } else {
                showFeedback("error", "Could not remove criterion.");
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

    // ── Table data ────────────────────────────────────────────────────────────

    const tableData = criteria.map((c) => ({ ...c }));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Back button */}
            <button
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-1 text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white"
            >
                ← Back to Rubrics
            </button>

            {/* Rubric info header */}
            {rubric && (
                <div className="mb-6 rounded-sm border border-stroke bg-white px-6 py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-xs font-medium uppercase text-body dark:text-bodydark">Rubric</p>
                    <h2 className="mt-1 text-title-md2 font-semibold text-black dark:text-white">
                        {rubric.title ?? rubric.id}
                    </h2>
                    {rubric.description && (
                        <p className="mt-1 text-sm text-body dark:text-bodydark">{rubric.description}</p>
                    )}
                </div>
            )}

            {/* Page header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white">Criteria</h3>
                    <p className="text-sm text-body dark:text-bodydark">
                        {editable
                            ? "Manage criteria for this rubric. Select multiple to assign them."
                            : "Browse criteria for this rubric."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {editable && selectedIds.size > 0 && (
                        <button
                            onClick={handleAssignSelected}
                            className="inline-flex items-center gap-2 rounded-md bg-meta-3 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                        >
                            Assign selected ({selectedIds.size})
                        </button>
                    )}
                    {editable && (
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                        >
                            + New Criterion
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
                        <p className="p-6 text-sm text-body dark:text-bodydark">Loading criteria…</p>
                    ) : criteria.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No criteria found for this rubric.</p>
                    ) : (
                        <SelectableTable
                            data={tableData}
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

            {/* CRUD panel — only visible for ADMIN / TEACHER, action on existing criterion */}
            {editable && crudMode && selectedCriterion && (
                <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">

                    {/*
                     * TODO: Replace the placeholder below with <CriterionCrudPanel /> when available.
                     *
                     * Suggested props:
                     *   <CriterionCrudPanel
                     *       mode={crudMode}                  // "create" | "edit" | "delete"
                     *       criterion={selectedCriterion}    // Criterion | null (null for create)
                     *       rubricId={rubricId}              // to pre-fill rubric_id on create
                     *       form={form}
                     *       onFormChange={setForm}
                     *       onSubmit={handleSubmit}
                     *       onClose={closeCrud}
                     *   />
                     */}

                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black dark:text-white">
                            {crudMode === "edit" && `Edit Criterion: ${selectedCriterion?.name ?? selectedCriterion?.id}`}
                            {crudMode === "delete" && `Remove Criterion: ${selectedCriterion?.name ?? selectedCriterion?.id}`}
                        </h3>
                        <button
                            onClick={closeCrud}
                            className="text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white"
                        >
                            ✕ Close
                        </button>
                    </div>

                    {/* Criterion info */}
                    <div className="mb-4 rounded-md border border-stroke bg-gray-2 px-4 py-3 text-sm dark:border-strokedark dark:bg-meta-4">
                        <p className="text-black dark:text-white"><span className="font-medium">ID:</span> {selectedCriterion.id}</p>
                        <p className="text-black dark:text-white"><span className="font-medium">Name:</span> {selectedCriterion.name ?? "—"}</p>
                        <p className="text-black dark:text-white"><span className="font-medium">Description:</span> {selectedCriterion.description ?? "—"}</p>
                        <p className="text-black dark:text-white"><span className="font-medium">Weight:</span> {selectedCriterion.weight ?? "—"}</p>
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
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Weight</label>
                                <input
                                    type="number"
                                    value={form.weight ?? 0}
                                    onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Delete confirmation */}
                    {crudMode === "delete" && (
                        <p className="text-sm text-red-500">
                            Are you sure you want to remove this criterion from the rubric?
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

            {/* Create panel — no criterion selected */}
            {editable && crudMode === "create" && !selectedCriterion && (
                <div className="mt-6 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black dark:text-white">Create Criterion</h3>
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
                            <label className="mb-1 block text-sm font-medium text-black dark:text-white">Weight</label>
                            <input
                                type="number"
                                value={form.weight ?? 0}
                                onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
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

export default CriteriaByRubricPage;
