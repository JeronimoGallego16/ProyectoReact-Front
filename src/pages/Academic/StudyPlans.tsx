import React, { useEffect, useState } from "react";
import ModalLauncher from "../../components/ModalLauncher";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from 'react-router-dom';
import { studyPlanService } from "../../services/StudyPlanService";
import { studyPlanSubjectService } from "../../services/StudyPlanSubjectService";
import { careerService } from "../../services/CareerService";
import { subjectService } from "../../services/SubjectService";
import { Career } from "../../models/Career";
import { StudyPlan } from "../../models/StudyPlan";
import { Subject } from "../../models/Subject";
import { UserRole } from "../../models/user";
import { showToast } from "../../hooks/fireToast";
import { useSwalConfirm } from '../../hooks/useSwalConfirm';
import CatalogPanel from './components/CatalogPanel';
import TableScroll from '../../components/TableScroll';
import GenericTable from '../../components/GenericTable';

// ─── Types ────────────────────────────────────────────────────────────────────

// component-level constants moved to subcomponents

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
    const [activeTab, setActiveTab] = useState<"catalog" | "structure" | "drafts">("structure");

    // Subjects state
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [planSubjects, setPlanSubjects] = useState<any[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Subject catalog state
    const [catalogSearchTerm, setCatalogSearchTerm] = useState("");

    // Modal state
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
    const [isPublishingPlan, setIsPublishingPlan] = useState(false);
    const [newPlanYear, setNewPlanYear] = useState<string>(String(new Date().getFullYear() + 1));

    // Subject detail modal
    const [detailSubject, setDetailSubject] = useState<Subject | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { showConfirm, showAlert } = useSwalConfirm();

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);
    const navigate = useNavigate();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
        setIsAddingSubject(true);
    };

    const handleViewSubject = async (subject: Subject) => {
        try {
            const full = await subjectService.getSubjectById(subject.id);
            setDetailSubject(full || subject);
        } catch (err) {
            setDetailSubject(subject);
        }
        setIsDetailOpen(true);
    };

    // Per-subject editing removed

    const handleConfirmAddSubject = async () => {
        if (!selectedSubjectForEdit || !selectedCareerId) return;

        const planToAddTo = draftPlan || activeStudyPlan;
        if (!planToAddTo) {
            showToast("Error", "No hay plan de estudios disponible", 2);
            return;
        }

        try {
            setIsAddingSubject(false);
            const alreadyLinked = planSubjects.some(ps => ps.id === selectedSubjectForEdit.id);
            if (alreadyLinked) {
                showToast("Aviso", `La asignatura "${selectedSubjectForEdit.name}" ya está vinculada al plan.`, 1);
                return;
            }

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
        const planToDeleteFrom = draftPlan || activeStudyPlan;
        if (!planToDeleteFrom) return;

        const validation = await studyPlanSubjectService.canRemoveSubjectFromStudyPlan(
            planToDeleteFrom.id,
            subject.id
        );

        if (!validation.canRemove) {
            await showAlert(`<p>${validation.reason || "No se puede eliminar esta asignatura"}</p><p>💡 Primero debes finalizar todas las inscripciones activas de esta asignatura.</p>`, { title: 'No se puede eliminar', confirmText: 'Entendido', cancelText: 'Entendido', });
            return;
        }

        const ok = await showConfirm(`¿Estás seguro que deseas remover <strong>${subject.name}</strong> del plan de estudios?`, { title: 'Confirmar eliminación' });
        if (!ok) return;

        try {
            await studyPlanSubjectService.removeSubjectFromStudyPlan(planToDeleteFrom.id, subject.id);
            showToast("Éxito", `Asignatura "${subject.name}" eliminada del plan.`, 0);
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

    // version history rendering moved to dedicated page/section if needed

    // ── Render ────────────────────────────────────────────────────────────────

    const currentPlan = draftPlan || activeStudyPlan;

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Page header */}
            <PageHeader
                title="Plan de estudios"
                description="Define y versiona las asignaturas que conforman el plan de estudios de cada carrera."
                primaryAction={
                    editable
                        ? {
                            label: draftPlan ? "Publicar plan" : "+ Nueva versión",
                            onClick: () => setIsPublishingPlan(true),
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
                            onClick={() => setIsHistoryOpen(true)}
                            className="w-full rounded-md border border-stroke bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark dark:text-white"
                        >
                            📋 Historial de versiones
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: Version History */}
            {isHistoryOpen && (
                <ModalLauncher isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}>
                    {() => (
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">Historial de versiones</h3>
                            <div className="space-y-3">
                                {studyPlanVersions.length === 0 ? (
                                    <p className="text-sm text-body dark:text-bodydark">No hay versiones disponibles.</p>
                                ) : (
                                    studyPlanVersions.map((version) => (
                                        <div key={version.id} className="flex items-center justify-between rounded border border-stroke bg-gray-2 p-3 dark:border-strokedark dark:bg-meta-4">
                                            <div>
                                                <p className="font-medium text-black dark:text-white">Versión {version.year}</p>
                                                <p className="text-xs text-body dark:text-bodydark">{version.is_published ? 'Publicado' : 'Borrador'}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsHistoryOpen(false);
                                                        navigate(`/academic/study-plans/${version.id}`);
                                                    }}
                                                    className="rounded bg-primary px-3 py-1 text-sm font-medium text-white hover:bg-opacity-90"
                                                >
                                                    Ver
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </ModalLauncher>
            )}

            {/* Tabs */}
            {!loading && currentPlan && (
                <div className="mb-6 border-b border-stroke dark:border-strokedark">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('catalog')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'catalog' ? 'border-b-2 border-primary text-primary dark:border-primary dark:text-primary' : 'text-body hover:text-primary dark:text-bodydark dark:hover:text-primary'
                            }`}
                        >
                            Catálogo
                        </button>
                        <button
                            onClick={() => setActiveTab('structure')}
                            className={`px-4 py-2 font-medium transition-colors ${
                                activeTab === 'structure' ? 'border-b-2 border-primary text-primary dark:border-primary dark:text-primary' : 'text-body hover:text-primary dark:text-bodydark dark:hover:text-primary'
                            }`}
                        >
                            Estructura del plan
                        </button>
                        {editable && (
                            <button
                                onClick={() => setActiveTab('drafts')}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === 'drafts' ? 'border-b-2 border-primary text-primary dark:border-primary dark:text-primary' : 'text-body hover:text-primary dark:text-bodydark dark:hover:text-primary'
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
            ) : activeTab === 'structure' ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Carrera</p>
                                    <p className="text-sm text-black dark:text-white">{careers.find(c => c.id === selectedCareerId)?.name ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Versión actual</p>
                                    <p className="text-sm text-black dark:text-white">{currentPlan ? currentPlan.year : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Estado</p>
                                    <p className="text-sm text-black dark:text-white">{draftPlan ? 'Borrador' : (activeStudyPlan ? 'Publicado' : '—')}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Total asignaturas</p>
                                    <p className="text-sm text-black dark:text-white">{planSubjects.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-body dark:text-bodydark">Total créditos</p>
                                    <p className="text-sm text-black dark:text-white">{planSubjects.reduce((s, x) => s + (x.credits ?? 0), 0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">Asignaturas del plan</h3>
                            </div>
                            <TableScroll maxHeight="55vh">
                                {planSubjects.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-body dark:text-bodydark">No hay asignaturas en este plan.</div>
                                ) : (
                                    <GenericTable
                                        data={planSubjects}
                                        columns={[
                                            { key: 'code', label: 'Código' },
                                            { key: 'name', label: 'Nombre' },
                                            { key: 'credits', label: 'Créditos' },
                                        ]}
                                        actions={editable ? [
                                            { name: 'view', label: 'Ver' },
                                            { name: 'delete', label: 'Eliminar' },
                                        ] : [ { name: 'view', label: 'Ver' } ]}
                                        onAction={(actionName, item) => {
                                            const s = item as Subject;
                                            if (actionName === 'view') void handleViewSubject(s);
                                            if (actionName === 'delete') void handleDeleteClick(s);
                                        }}
                                    />
                                )}
                            </TableScroll>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'catalog' ? (
                <CatalogPanel subjects={filteredCatalog} searchTerm={catalogSearchTerm} onSearch={setCatalogSearchTerm} onAdd={handleAddSubjectClick} editable={editable} />
            ) : (
                // DRAFTS
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">Borradores</h3>
                    </div>
                    <div className="p-6">
                        {studyPlanVersions.filter(p => !p.is_published).length === 0 ? (
                            <p className="text-sm text-body dark:text-bodydark">No hay borradores. Crea una nueva versión para empezar.</p>
                        ) : (
                            <div className="space-y-3">
                                {studyPlanVersions.filter(p => !p.is_published).map((plan) => (
                                    <div key={plan.id} className="flex items-center justify-between rounded border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                                        <div>
                                            <p className="font-medium text-black dark:text-white">Versión {plan.year}</p>
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
                                            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

            {isDetailOpen && detailSubject && (
                <ModalLauncher isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}>
                    {() => (
                        <div className="space-y-5 p-4">
                            <div>
                                <h3 className="text-xl font-semibold text-black dark:text-white">Detalles de la asignatura</h3>
                                <p className="mt-1 text-sm text-body dark:text-bodydark">Revisa la información completa de la asignatura.</p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Código</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{detailSubject.code}</p>
                                </div>
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Nombre</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{detailSubject.name}</p>
                                </div>
                                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Créditos</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{detailSubject.credits}</p>
                                </div>
                                <div className="sm:col-span-2 rounded-md border border-stroke p-4 dark:border-strokedark">
                                    <p className="text-sm font-medium text-body dark:text-bodydark">Descripción</p>
                                    <p className="mt-2 text-base text-black dark:text-white">{detailSubject.description || 'Sin descripción'}</p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </ModalLauncher>
            )}

        </div>
    );
};

export default StudyPlansPage;