import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import PageHeader from "../../components/PageHeader";
import EntityHeader from "../../components/EntityHeader";
import { gradeService } from "../../services/GradeService";
// TODO: Import rubricService when resolving scale names
// import { rubricService } from "../../services/RubricService";
import { Grade } from "../../models/Grade";
import { GradeDetail } from "../../models/GradeDetail";
import { useNavigate, useParams } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

const COLUMNS = ["score", "scale_id", "comment"];

// GradeDetail is read-only — no actions needed
const ACTIONS: { name: string; label: string }[] = [];

// ─── Component ────────────────────────────────────────────────────────────────

const GradeDetailPage: React.FC = () => {
    const { gradeId } = useParams<{ gradeId: string }>();
    const navigate = useNavigate();

    const [grade, setGrade] = useState<Grade | null>(null);
    const [details, setDetails] = useState<GradeDetail[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Data loading ──────────────────────────────────────────────────────────

    const loadData = async () => {
        if (!gradeId) return;
        setLoading(true);
        const gradeResponse = await gradeService.getGradeById(gradeId);
        const gradeData = gradeResponse.data ?? null;

        setGrade(gradeData);
        setDetails(Array.isArray(gradeData?.details) ? gradeData.details : []);

        // TODO: Once scale names are needed, resolve them here:
        // const scaleIds = [...new Set(gradeData?.details?.map(d => d.scale_id) ?? [])];
        // const scales = await Promise.all(scaleIds.map(id => rubricService.getScaleById(id)));
        // Map scale names into tableData below instead of showing scale_id raw.

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [gradeId]);

    // ── Table data ────────────────────────────────────────────────────────────

    const tableData = details.map((d) => ({
        ...d,
        comment: d.comment ?? "—",
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
                    description={[
                        `Enrollment: ${grade.enrollment_id}`,
                        `Estado: ${grade.status}`,
                        grade.observations ? `Observaciones: ${grade.observations}` : null,
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                />
            )}

            {/* Page header */}
            <PageHeader
                title="Detalle de Nota"
                description="Consulta el desglose de criterios y puntajes para esta nota."
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
