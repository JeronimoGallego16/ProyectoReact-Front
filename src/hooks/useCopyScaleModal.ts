import { useState } from "react";
import { Criterion } from "../models/Criterion";
import { Scale } from "../models/Scale";
import { criterionService } from "../services/CriterionService";
import { scaleService } from "../services/ScaleService";
import { showToast } from "./fireToast";

type UseCopyScaleModalParams = {
    criterionId?: string;
    rubricId?: string;
    onCopySuccess?: () => Promise<void> | void;
};

export function useCopyScaleModal({ criterionId, rubricId, onCopySuccess }: UseCopyScaleModalParams) {
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [sourceScale, setSourceScale] = useState<Scale | null>(null);
    const [targetCriteria, setTargetCriteria] = useState<Criterion[]>([]);
    const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    const closeCopyModal = () => {
        setIsCopyModalOpen(false);
        setSourceScale(null);
        setTargetCriteria([]);
        setSelectedTargetIds(new Set());
    };

    const toggleTargetSelection = (targetCriterionId: string) => {
        setSelectedTargetIds((prev) => {
            const next = new Set(prev);
            next.has(targetCriterionId) ? next.delete(targetCriterionId) : next.add(targetCriterionId);
            return next;
        });
    };

    const openCopyModal = async (scale: Scale) => {
        if (!rubricId) {
            showToast("Error", "No se pudo determinar la rúbrica del criterio actual.", 2);
            return;
        }

        setSourceScale(scale);
        setSelectedTargetIds(new Set());
        setIsCopyModalOpen(true);
        setLoadingTargets(true);

        const response = await criterionService.getCriteriaByRubricId(rubricId);
        const allCriteria = Array.isArray(response.data) ? response.data : [];
        const availableTargets = allCriteria.filter((item) => item.id !== criterionId);
        setTargetCriteria(availableTargets);
        setLoadingTargets(false);
    };

    const handleCopyToSelectedCriteria = async () => {
        if (!sourceScale) {
            showToast("Error", "No hay una escala seleccionada para copiar.", 2);
            return;
        }

        if (selectedTargetIds.size === 0) {
            showToast("Error", "Selecciona al menos un criterio destino.", 2);
            return;
        }

        setIsCopying(true);
        let successCount = 0;
        let failCount = 0;

        for (const targetCriterionId of selectedTargetIds) {
            const response = await scaleService.copyScaleToCriterion(sourceScale.id, targetCriterionId);
            if (response.data) {
                successCount += 1;
            } else {
                failCount += 1;
            }
        }

        setIsCopying(false);

        if (successCount > 0) {
            showToast(
                failCount === 0 ? "Éxito" : "Error",
                `${successCount} copia(s) realizada(s).${failCount > 0 ? ` ${failCount} no se pudieron copiar.` : ""}`,
                failCount === 0 ? 0 : 2
            );
            closeCopyModal();
            await onCopySuccess?.();
            return;
        }

        showToast("Error", "No se pudo copiar la escala a los criterios seleccionados.", 2);
    };

    return {
        isCopyModalOpen,
        sourceScale,
        targetCriteria,
        selectedTargetIds,
        loadingTargets,
        isCopying,
        openCopyModal,
        closeCopyModal,
        toggleTargetSelection,
        handleCopyToSelectedCriteria,
    };
}