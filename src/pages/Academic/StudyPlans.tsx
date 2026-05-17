import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import TableScroll from "../../components/TableScroll";
import ModalLauncher from "../../components/ModalLauncher";
import PageHeader from "../../components/PageHeader";
import { studyPlanService } from "../../services/StudyPlanService";
import { studyPlanSubjectService } from "../../services/StudyPlanSubjectService";
import { careerService } from "../../services/CareerService";
import { subjectService } from "../../services/SubjectService";
import { Career } from "../../models/Career";
import { StudyPlan } from "../../models/StudyPlan";
import { Subject } from "../../models/Subject";
import { UserRole } from "../../models/user";
import { showToast } from "../../hooks/fireToast";

// ─── Types ────────────────────────────────────────────────────────────────────

const STUDY_PLAN_SUBJECTS_COLUMNS = ["suggested_semester", "code", "name", "credits"];

const EDIT_ACTIONS = [
    { name: "edit", label: "Editar" },
    { name: "delete", label: "Eliminar" },
];

const VIEW_ACTIONS: { name: string; label: string }[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

// ─── Component ────────────────────────────────────────────────────────────────

const StudyPlansPage: React.FC = () => {
    // Main state
    const [careers, setCareers] = useState<Career[]>([]);
    const [selectedCareerId, setSelectedCareerId] = useState<string>("");
    const [activeStudyPlan, setActiveStudyPlan] = useState<StudyPlan | null>(null);
    const [studyPlanVersions, setStudyPlanVersions] = useState<StudyPlan[]>([]);
    const [draftPlan, setDraftPlan] = useState<StudyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"structure" | "drafts">("structure");

    // Subjects state
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [planSubjects, setPlanSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Subject catalog state
    const [catalogSearchTerm, setCatalogSearchTerm] = useState("");

    // Modal state
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
    const [selectedSemesterForEdit, setSelectedSemesterForEdit] = useState<number>(1);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
    const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);
    const [isPublishingPlan, setIsPublishingPlan] = useState(false);
    const [newPlanYear, setNewPlanYear] = useState<string>(String(new Date().getFullYear() + 1));

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Load Careers ──────────────────────────────────────────────────────────

    const loadCareers = async () => {
        setLoading(true);
        const careersList = await careerService.getCareers();
        setCareers(careersList.filter(c => c.is_active));
        if (careersList.length > 0 && !selectedCareerId) {
            setSelectedCareerId(careersList[0].id);
        }
        setLoading(false);
    };

    useEffect(() => {
        void loadCareers();
    }, []);

    // ── Load Study Plans and Subjects by Career ────────────────────────────

    const loadStudyPlansByCareer = async (careerId: string) => {
        if (!careerId) return;

        setLoadingSubjects(true);

        // Load all study plans for the career
        const plans = await studyPlanService.getStudyPlansByCareer(careerId);
        setStudyPlanVersions(plans.sort((a, b) => b.year - a.year));

        // Get active (published) plan
        const active = await studyPlanService.getActiveStudyPlan(careerId);
        setActiveStudyPlan(active);

        // Get draft plan (most recent unpublished)
        const draft = plans.filter(p => !p.is_published).sort((a, b) => b.year - a.year)[0] || null;
        setDraftPlan(draft);

        // Load subjects of the active or draft plan
        const planToUse = draft || active;
        if (planToUse) {
            const subjects = await studyPlanSubjectService.getSubjectsByStudyPlan(planToUse.id);
            setPlanSubjects(subjects);
        } else {
            setPlanSubjects([]);
        }

        // Load all available subjects
        const allSubjects = await subjectService.getSubjects();
        setAvailableSubjects(allSubjects.filter(s => s.is_active));

        setLoadingSubjects(false);
    };

    useEffect(() => {
        if (selectedCareerId) {
            void loadStudyPlansByCareer(selectedCareerId);
        }
    }, [selectedCareerId]);

    // ── Get filtered subject catalog ────────────────────────────────────────

    const filteredCatalog = availableSubjects.filter(subject => {
        const alreadyInPlan = planSubjects.some(ps => ps.id === subject.id);
        if (alreadyInPlan) return false;

        const searchLower = catalogSearchTerm.toLowerCase();
        return (
            subject.name.toLowerCase().includes(searchLower) ||
            subject.code.toLowerCase().includes(searchLower)
        );
    });

    // ── Handle add subject to plan ──────────────────────────────────────────

    const handleAddSubjectClick = (subject: Subject) => {
        setSelectedSubjectForEdit(subject);
        setSelectedSemesterForEdit(1);
        setIsAddingSubject(true);
    };

    const handleConfirmAddSubject = async () => {
        if (!selectedSubjectForEdit || !selectedCareerId) return;

        const planToAddTo = draftPlan || activeStudyPlan;
        if (!planToAddTo) {
            showToast("Error", "No hay plan de estudios disponible", 2);
            return;
        }

        try {
            setIsAddingSubject(false);
            await studyPlanSubjectService.addSubjectToStudyPlan(planToAddTo.id, selectedSubjectForEdit.id);
            showToast("Éxito", `Asignatura "${selectedSubjectForEdit.name}" agregada exitosamente.`, 0);
            setCatalogSearchTerm("");
            await loadStudyPlansByCareer(selectedCareerId);
        } catch (error) {
            showToast("Error", `No se pudo agregar la asignatura: ${error instanceof Error ? error.message : String(error)}`, 2);
        }
    };

    // ── Handle delete subject from plan ────────────────────────────────────

    const handleDeleteClick = async (subject: Subject) => {
        setSubjectToDelete(subject);
        setDeleteBlockedReason(null);

        const planToDeleteFrom = draftPlan || activeStudyPlan;
        if (!planToDeleteFrom) return;

        const validation = await studyPlanSubjectService.canRemoveSubjectFromStudyPlan(
            planToDeleteFrom.id,
            subject.id
        );

        if (!validation.canRemove) {
            setDeleteBlockedReason(validation.reason || "No se puede eliminar esta asignatura");
            setIsConfirmingDelete(true);
        } else {
            setIsConfirmingDelete(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!subjectToDelete || !selectedCareerId) return;

        const planToDeleteFrom = draftPlan || activeStudyPlan;
        if (!planToDeleteFrom) return;

        try {
            setIsConfirmingDelete(false);
            await studyPlanSubjectService.removeSubjectFromStudyPlan(planToDeleteFrom.id, subjectToDelete.id);
            showToast("Éxito", `Asignatura "${subjectToDelete.name}" eliminada del plan.`, 0);
            await loadStudyPlansByCareer(selectedCareerId);
        } catch (error) {
            showToast("Error", `No se pudo eliminar la asignatura: ${error instanceof Error ? error.message : String(error)}`, 2);
        }
    };

    // ── Handle create new version ──────────────────────────────────────────

    const handleCreateNewVersion = async () => {
        if (!selectedCareerId) return;

        const year = parseInt(newPlanYear, 10);
        if (!Number.isInteger(year) || year <= 0) {
            showToast("Error", "El año debe ser un número válido", 2);
            return;
        }

        // Check if version already exists
        const existingVersion = studyPlanVersions.find(p => p.year === year);
        if (existingVersion) {
            showToast("Error", `Ya existe una versión para el año ${year}`, 2);
            return;
        }

        try {
            const newPlan = await studyPlanService.createStudyPlan({
                career_id: selectedCareerId,
                name: `Plan de Estudios ${year}`,
                year,
                suggested_semester: 1,
                is_published: false,
            });

            if (!newPlan) {
                showToast("Error", "No se pudo crear la nueva versión", 2);
                return;
            }

            setIsPublishingPlan(false);
            showToast("Éxito", `Plan de estudios ${year} creado como borrador.`, 0);
            await loadStudyPlansByCareer(selectedCareerId);
        } catch (error) {
            showToast("Error", `Error al crear nueva versión: ${error instanceof Error ? error.message : String(error)}`, 2);
        }
    };

    // ── Handle publish plan ────────────────────────────────────────────────

    const handlePublishPlan = async () => {
        if (!draftPlan) return;

        if (planSubjects.length === 0) {
            showToast("Error", "No se puede publicar un plan sin asignaturas", 2);
            return;
        }

        try {
            const published = await studyPlanService.publishStudyPlan(draftPlan.id);
            if (!published) {
                showToast("Error", "No se pudo publicar el plan", 2);
                return;
            }

            setIsPublishingPlan(false);
            showToast("Éxito", `Plan de estudios ${draftPlan.year} publicado exitosamente.`, 0);
            await loadStudyPlansByCareer(selectedCareerId);
        } catch (error) {
            showToast("Error", `Error al publicar: ${error instanceof Error ? error.message : String(error)}`, 2);
        }
    };

    // ── Render version history ──────────────────────────────────────────────

    const renderVersionHistory = () => {
        if (studyPlanVersions.length === 0) {
            return <p className="p-4 text-sm text-body dark:text-bodydark">No hay versiones del plan.</p>;
        }

        return (
            <div className="space-y-2">
                {studyPlanVersions.map((version) => (
                    <div
                        key={version.id}
                        className="flex items-center justify-between rounded border border-stroke bg-gray-2 p-3 dark:border-strokedark dark:bg-meta-4"
                    >
                        <div>
                            <p className="font-medium text-black dark:text-white">{version.year}</p>
                            <p className="text-xs text-body dark:text-bodydark">
                                {version.is_published ? (
                                    <span className="inline-block rounded bg-green-1 px-2 py-1 text-green dark:bg-green-1">
                                        Publicado
                                    </span>
                                ) : (
                                    <span className="inline-block rounded bg-yellow-1 px-2 py-1 text-yellow dark:bg-yellow-1">
                                        Borrador
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────

    const currentPlan = draftPlan || activeStudyPlan;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Page header */}
            <PageHeader
                title="Plan de estudios"
                description="Define y versiona las asignaturas que conforman el plan de estudios de cada carrera."
                primaryAction={
                    editable && currentPlan
                        ? {
                            label: draftPlan ? "Publicar plan" : "+ Nueva versión",
                            onClick: () => {
                                if (draftPlan) {
                                    setIsPublishingPlan(true);
                                } else {
                                    setIsPublishingPlan(true);
                                }
                            },
                        }
                        : undefined
                }
            />

            {/* Career and version selector */}
            {!loading && (
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Carrera
                        </label>
                        <select
                            value={selectedCareerId}
                            onChange={(e) => setSelectedCareerId(e.target.value)}
                            className="relative inline-flex w-full rounded border border-stroke bg-transparent px-4 py-2 text-black outline-none transition dark:border-strokedark dark:text-white"
                        >
                            {careers.map((career) => (
                                <option key={career.id} value={career.id}>
                                    {career.code} - {career.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Versión activa (publicada)
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-black dark:text-white">
                                {activeStudyPlan ? activeStudyPlan.year : "—"}
                            </span>
                            {activeStudyPlan && (
                                <span className="inline-block rounded bg-green-1 px-2 py-1 text-xs font-medium text-green dark:bg-green-1">
                                    Publicado
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                // Open version history modal or side panel
                            }}
                            className="w-full rounded-md border border-stroke bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark dark:text-white"
                        >
                            📋 Historial de versiones
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            {!loading && currentPlan && (
                <div className="mb-6 border-b border-stroke dark:border-strokedark">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab("structure")}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === "structure"
                                    ? "border-b-2 border-primary text-primary dark:border-primary dark:text-primary"
                                    : "text-body hover:text-primary dark:text-bodydark dark:hover:text-primary"
                            }`}
                        >
                            Estructura del plan
                        </button>
                        {editable && (
                            <button
                                onClick={() => setActiveTab("drafts")}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === "drafts"
                                        ? "border-b-2 border-primary text-primary dark:border-primary dark:text-primary"
                                        : "text-body hover:text-primary dark:text-bodydark dark:hover:text-primary"
                                }`}
                            >
                                Borradores
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Loading state */}
            {loading || loadingSubjects ? (
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-sm text-body dark:text-bodydark">Cargando plan de estudios…</p>
                </div>
            ) : !currentPlan ? (
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <p className="text-sm text-body dark:text-bodydark">No hay plan de estudios disponible para esta carrera.</p>
                </div>
            ) : activeTab === "structure" ? (
                // ── STRUCTURE TAB ──
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Subject Catalog (left) */}
                    <div className="lg:col-span-1">
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">
                                    Catálogo de asignaturas
                                </h3>
                            </div>
                            <div className="p-4">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o código…"
                                    value={catalogSearchTerm}
                                    onChange={(e) => setCatalogSearchTerm(e.target.value)}
                                    className="mb-4 w-full rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition placeholder:text-bodydark dark:border-strokedark dark:text-white"
                                />

                                <div className="max-h-[60vh] overflow-y-auto space-y-2">
                                    {filteredCatalog.length === 0 ? (
                                        <p className="text-xs text-body dark:text-bodydark">
                                            {catalogSearchTerm
                                                ? "No se encontraron asignaturas"
                                                : "Todas las asignaturas están agregadas"}
                                        </p>
                                    ) : (
                                        filteredCatalog.map((subject) => (
                                            <div
                                                key={subject.id}
                                                className="flex items-center justify-between rounded border border-stroke bg-gray-2 p-2 dark:border-strokedark dark:bg-meta-4"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-black dark:text-white truncate">
                                                        {subject.code}
                                                    </p>
                                                    <p className="text-xs text-body dark:text-bodydark truncate">
                                                        {subject.name}
                                                    </p>
                                                </div>
                                                {editable && (
                                                    <button
                                                        onClick={() => handleAddSubjectClick(subject)}
                                                        className="ml-2 flex-shrink-0 rounded bg-primary px-2 py-1 text-white hover:bg-opacity-90"
                                                    >
                                                        +
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Plan (center-right) */}
                    <div className="lg:col-span-2">
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-black dark:text-white">
                                            Plan de estudios — Versión {currentPlan.year}
                                        </h3>
                                        {currentPlan.is_published && (
                                            <span className="inline-block rounded bg-green-1 px-2 py-1 text-xs font-medium text-green dark:bg-green-1 mt-1">
                                                Publicado
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-body dark:text-bodydark">
                                        {planSubjects.length} asignatura{planSubjects.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>

                            <TableScroll maxHeight="60vh">
                                {planSubjects.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-body dark:text-bodydark">
                                        <p>No hay asignaturas en el plan de estudios</p>
                                        <p className="mt-2 text-xs">Agrega asignaturas desde el catálogo</p>
                                    </div>
                                ) : (
                                    <GenericTable
                                        data={planSubjects}
                                        columns={STUDY_PLAN_SUBJECTS_COLUMNS}
                                        actions={editable ? EDIT_ACTIONS : VIEW_ACTIONS}
                                        onAction={(actionName, item) => {
                                            const subject = item as Subject;
                                            if (actionName === "edit") {
                                                // Edit action - could be used for future functionality
                                                console.log("Edit subject", subject);
                                            } else if (actionName === "delete") {
                                                void handleDeleteClick(subject);
                                            }
                                        }}
                                    />
                                )}
                            </TableScroll>
                        </div>
                    </div>

                    {/* Details Panel (right) */}
                    <div className="lg:col-span-1">
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">
                                    Detalles del plan (Versión {currentPlan.year})
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Carrera:</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {careers.find(c => c.id === selectedCareerId)?.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Año (versión):</p>
                                    <p className="text-sm text-black dark:text-white">{currentPlan.year}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Estado:</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {currentPlan.is_published ? (
                                            <span className="inline-block rounded bg-green-1 px-2 py-1 text-xs text-green">
                                                Publicado
                                            </span>
                                        ) : (
                                            <span className="inline-block rounded bg-yellow-1 px-2 py-1 text-xs text-yellow">
                                                Borrador
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Total asignaturas:</p>
                                    <p className="text-sm text-black dark:text-white">{planSubjects.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Total créditos:</p>
                                    <p className="text-sm text-black dark:text-white">
                                        {planSubjects.reduce((sum, s) => sum + s.credits, 0)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Última actualización:</p>
                                    <p className="text-xs text-body dark:text-bodydark">
                                        {currentPlan.updated_at
                                            ? new Date(currentPlan.updated_at).toLocaleDateString()
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Version History */}
                        <div className="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">
                                    Historial de versiones
                                </h3>
                            </div>
                            <div className="max-h-[40vh] overflow-y-auto p-4">
                                {renderVersionHistory()}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // ── DRAFTS TAB ──
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">Borradores</h3>
                    </div>
                    <div className="p-6">
                        {studyPlanVersions.filter(p => !p.is_published).length === 0 ? (
                            <p className="text-sm text-body dark:text-bodydark">
                                No hay borradores. Crea una nueva versión para empezar.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {studyPlanVersions
                                    .filter(p => !p.is_published)
                                    .map((plan) => (
                                        <div
                                            key={plan.id}
                                            className="flex items-center justify-between rounded border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4"
                                        >
                                            <div>
                                                <p className="font-medium text-black dark:text-white">
                                                    Versión {plan.year}
                                                </p>
                                                <p className="text-xs text-body dark:text-bodydark">Borrador</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Add Subject */}
            {isAddingSubject && selectedSubjectForEdit && (
                <ModalLauncher
                    isOpen={isAddingSubject}
                    onClose={() => setIsAddingSubject(false)}
                >
                    {() => (
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                                Agregar asignatura al plan
                            </h3>
                            <div className="mb-4 space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Asignatura
                                    </label>
                                    <p className="text-sm text-body dark:text-bodydark">
                                        {selectedSubjectForEdit.code} - {selectedSubjectForEdit.name}
                                    </p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Semestre sugerido
                                    </label>
                                    <select
                                        value={selectedSemesterForEdit}
                                        onChange={(e) => setSelectedSemesterForEdit(parseInt(e.target.value, 10))}
                                        className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition dark:border-strokedark dark:text-white"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                                            <option key={sem} value={sem}>
                                                Semestre {sem}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <p className="text-xs text-body dark:text-bodydark">
                                        Créditos: <span className="font-medium">{selectedSubjectForEdit.credits}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddingSubject(false)}
                                    className="rounded border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmAddSubject}
                                    className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    )}
                </ModalLauncher>
            )}

            {/* Modal: Delete Subject */}
            {isConfirmingDelete && subjectToDelete && (
                <ModalLauncher
                    isOpen={isConfirmingDelete}
                    onClose={() => setIsConfirmingDelete(false)}
                >
                    {() => (
                        <div>
                            {deleteBlockedReason ? (
                                <>
                                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
                                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">⚠️</p>
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
                                        No se puede eliminar
                                    </h3>
                                    <p className="mb-4 text-sm text-body dark:text-bodydark">
                                        {deleteBlockedReason}
                                    </p>
                                    <div className="text-sm text-body dark:text-bodydark">
                                        <p className="mb-2">
                                            Primero debes finalizar todas las inscripciones activas de esta asignatura.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmingDelete(false)}
                                            className="rounded bg-gray-400 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500"
                                        >
                                            Entendido
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                                        Confirmar eliminación
                                    </h3>
                                    <p className="mb-4 text-sm text-body dark:text-bodydark">
                                        ¿Estás seguro que deseas remover la asignatura{" "}
                                        <span className="font-medium">"{subjectToDelete.name}"</span> del plan de
                                        estudios?
                                    </p>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmingDelete(false)}
                                            className="rounded border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmDelete}
                                            className="rounded bg-red px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </ModalLauncher>
            )}

            {/* Modal: Publish Plan */}
            {isPublishingPlan && (
                <ModalLauncher
                    isOpen={isPublishingPlan}
                    onClose={() => setIsPublishingPlan(false)}
                >
                    {() => (
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                                {draftPlan ? "Publicar nueva versión" : "Crear nueva versión"}
                            </h3>

                            {draftPlan ? (
                                <>
                                    <p className="mb-4 text-sm text-body dark:text-bodydark">
                                        Edita por publicar una nueva versión del plan de estudios para{" "}
                                        <span className="font-medium">
                                            {careers.find(c => c.id === selectedCareerId)?.name}
                                        </span>
                                        .
                                    </p>
                                    {planSubjects.length === 0 && (
                                        <div className="mb-4 rounded bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                                            ⚠️ El plan no tiene asignaturas. Agrega al menos una antes de publicar.
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsPublishingPlan(false)}
                                            className="rounded border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePublishPlan}
                                            disabled={planSubjects.length === 0}
                                            className="rounded bg-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Publicar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="mb-4 text-sm text-body dark:text-bodydark">
                                        Crea una nueva versión del plan de estudios.
                                    </p>
                                    <div className="mb-4">
                                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                            Año (versión)
                                        </label>
                                        <input
                                            type="number"
                                            value={newPlanYear}
                                            onChange={(e) => setNewPlanYear(e.target.value)}
                                            className="w-full rounded border border-stroke bg-transparent px-3 py-2 text-black outline-none transition dark:border-strokedark dark:text-white"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsPublishingPlan(false)}
                                            className="rounded border border-stroke px-4 py-2 text-sm font-medium text-body hover:bg-gray-2 dark:border-strokedark dark:text-bodydark"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCreateNewVersion}
                                            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                        >
                                            Crear
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </ModalLauncher>
            )}

        </div>
    );
};

export default StudyPlansPage;