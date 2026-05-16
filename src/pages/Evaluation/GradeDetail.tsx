import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GenericTable from "../../components/GenericTable";
import PageHeader from "../../components/PageHeader";
import EntityHeader from "../../components/EntityHeader";

import { gradeService } from "../../services/GradeService";
import { scaleService } from "../../services/ScaleService";
import { criterionService } from "../../services/CriterionService";

import { Grade } from "../../models/Grade";
import { GradeDetail } from "../../models/GradeDetail";

// ─── Types ────────────────────────────────────────────────────────────────────
const COLUMNS = ["score", "name", "criterion_description", "comment"];

// GradeDetail is read-only — no actions needed
const ACTIONS: { name: string; label: string }[] = [];

// ─── Component ────────────────────────────────────────────────────────────────
const GradeDetailPage: React.FC = () => {
    const { gradeId } = useParams<{ gradeId: string }>();
    const navigate = useNavigate();

    const [grade, setGrade] = useState<Grade | null>(null);
    const [details, setDetails] = useState<GradeDetail[]>([]);
    const [scaleNameMap, setScaleNameMap] = useState<Record<string, string>>({});
    const [scaleCriterionMap, setScaleCriterionMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    // ── Data loading ──────────────────────────────────────────────────────────
    const loadData = async () => {
        if (!gradeId) return;
        setLoading(true);

        try {
            const gradeResponse = await gradeService.getGradeById(gradeId);
            const gradeData = gradeResponse.data ?? null;

            setGrade(gradeData);
            const resolvedDetails = Array.isArray(gradeData?.details) ? gradeData.details : [];
            setDetails(resolvedDetails);

            // Resolve scale names + associated criterion descriptions
            const scaleIds = [...new Set(resolvedDetails.map((d) => d.scale_id).filter(Boolean))] as string[];
            if (scaleIds.length > 0) {
                const scaleResponses = await Promise.all(scaleIds.map((id) => scaleService.getScaleById(id)));
                const scaleMap: Record<string, string> = {};
                scaleResponses.forEach((r) => {
                    if (r.data) scaleMap[r.data.id] = r.data.name ?? String(r.data.id);
                });

                // Resolve the criteria referenced by the scales
                const criterionIds = [...new Set(scaleResponses.map((r) => r.data?.criterion_id).filter(Boolean))] as string[];
                const criterionResponses = await Promise.all(
                    criterionIds.map((id) => criterionService.getCriterionById(id))
                );
                const criterionMap: Record<string, string> = {};
                criterionResponses.forEach((r) => {
                    if (r.data) criterionMap[r.data.id] = r.data.description ?? "";
                });

                const scaleToCriterionDesc: Record<string, string> = {};
                scaleResponses.forEach((r) => {
                    const s = r.data;
                    if (s) {
                        scaleToCriterionDesc[s.id] = criterionMap[s.criterion_id ?? ""] ?? "";
                    }
                });

                setScaleNameMap(scaleMap);
                setScaleCriterionMap(scaleToCriterionDesc);
            } else {
                setScaleNameMap({});
                setScaleCriterionMap({});
            }
        } catch (err) {
            console.warn("No se pudieron resolver los nombres de escala o criterios:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [gradeId]);

    // ── Table data ────────────────────────────────────────────────────────────
    const tableData = details.map((d) => ({
        ...d,
        name: scaleNameMap[d.scale_id] ?? d.scale_id ?? "—",
        comment: d.comment ?? "—",
        criterion_description: scaleCriterionMap[d.scale_id] ?? "—",
    }));

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {/* Entity header with back button and grade info */}
            {grade && (
                <EntityHeader
                    onBack={() => navigate(-1)}
                    backLabel="← Volver"
                    title={`Nota Final: ${grade.final_score}`}
                    description={grade.observations ? `Observaciones: ${grade.observations}` : "Sin observaciones"}
                />
            )}

            {/* Page header */}
            <PageHeader
                title="Detalle de Nota"
                description="Consulta el desglose de escalas por criterio y puntajes para esta nota."
            />

            {/* Table */}
            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[60vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando detalle…</p>
                    ) : details.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron detalles para esta nota.</p>
                    ) : (
                        <GenericTable 
                            data={tableData} 
                            columns={COLUMNS} 
                            actions={ACTIONS} 
                            onAction={() => {}} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GradeDetailPage;