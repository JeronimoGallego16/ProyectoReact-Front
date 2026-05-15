import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SelectableTable from "../../components/SelectableTable";
import PageHeader from "../../components/PageHeader";
import { rubricService } from "../../services/RubricService";
import { evaluationService } from "../../services/EvaluationService";
import { Rubric } from "../../models/Rubric";
import { Evaluation } from "../../models/Evaluation";
import EntityHeader from "../../components/EntityHeader";
//import securityService from "../../services/segurity.service";
import { UserRole } from "../../models/user";
import { showToast } from "../../hooks/fireToast";

// ─── Types ────────────────────────────────────────────────────────────────────

const COLUMNS = ["title", "description"];

const ADMIN_TEACHER_ACTIONS = [{ name: "view", label: "Ver" }];

const STUDENT_ACTIONS = [
    { name: "view", label: "Ver" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const canEdit = (role: UserRole): boolean => role === "ADMIN" || role === "TEACHER";

const RubricForEvaluationPage: React.FC = () => {
    const { evaluationId } = useParams<{ evaluationId: string }>();
    const navigate = useNavigate();
    const onBack = () => navigate(-1);

    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
    const [loading, setLoading] = useState(true);

    //const user = securityService.getUser();
    //const role: UserRole = user?.role ?? "STUDENT";
    
    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadData = async () => {
        if (!evaluationId) return;
        setLoading(true);
        try {
            const [evaluationResponse, rubricsResponse] = await Promise.all([
                evaluationService.getEvaluationById(evaluationId),
                rubricService.getRubrics(),
            ]);

            setEvaluation(evaluationResponse.data || null);

            const allRubrics = Array.isArray(rubricsResponse.data) ? rubricsResponse.data : [];
            // mostrar solo rúbricas públicas y no archivadas
            const available = allRubrics.filter(r => r.is_public && !r.is_archived);
            setRubrics(available);
            setSelectedRubric(null);
        } catch (err) {
            showToast("Error", "No se pudo cargar la evaluación o las rúbricas.", 2);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [evaluationId]);

    // ── CRUD handlers ─────────────────────────────────────────────────────────

    const handleAction = (actionName: string, item: Record<string, any>) => {
        const rubric = item as Rubric;

        if (actionName === "select") {
            setSelectedRubric(rubric);
            return;
        }

        if (actionName === "view") {
            navigate(`/rubrics/${rubric.id}/criteria`);
            return;
        }
    };

    const handleAssign = async (rubricId: string) => {
        if (!evaluation) {
            showToast("Error", "La evaluación no está cargada.", 2);
            return;
        }
        setLoading(true);
        try {
            const response = await evaluationService.associateRubric(evaluation.id, rubricId);
            if (response.data) {
                showToast("Éxito", "Rúbrica asignada a la evaluación.", 0);
                setSelectedRubric(null);
                await loadData();
            } else {
                showToast("Error", response.error || "No se pudo asignar la rúbrica.", 2);
            }
        } catch (err) {
            showToast("Error", "Ocurrió un error al asignar la rúbrica.", 2);
        } finally {
            setLoading(false);
        }
    };

     return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">

            {/* Entity header with back button and evaluation info */}
            {evaluation && (
                <EntityHeader
                    onBack={onBack}
                    backLabel="← Volver"
                    title={evaluation.name ?? evaluation.id}
                    description={evaluation.description}
                    entityType="Evaluación"
                >
                    {evaluation.weight !== undefined && (
                        <p className="text-sm text-body dark:text-bodydark">Peso: {evaluation.weight}</p>
                    )}
                </EntityHeader>
            )}

            {/* Page header */}
            <PageHeader
                title="Evaluación"
                description={editable
                    ? "Asigna una rúbrica para esta evaluación. Selecciona una para asignarla."
                    : "Explora las rúricas para esta evaluación."}
            >
            </PageHeader>

            {editable && selectedRubric && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-sm border border-stroke bg-white px-4 py-3 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div>
                        <p className="text-sm font-medium text-black dark:text-white">
                            Rúbrica seleccionada: {selectedRubric.title}
                        </p>
                        <p className="text-xs text-body dark:text-bodydark">
                            Pulsa asignar para vincularla a esta evaluación.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleAssign(selectedRubric.id)}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={loading}
                    >
                        Asignar
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando rúbricas…</p>
                    ) : rubrics.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se econtraron rúbricas.</p>
                    ) : (
                        <SelectableTable
                            data={rubrics}
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
        </div>
    );
};

export default RubricForEvaluationPage;