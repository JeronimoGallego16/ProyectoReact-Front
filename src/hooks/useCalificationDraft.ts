import { calificationDraftStorage, CalificationDraft } from "../utils/CalificationDraftStorage";
import { useCallback } from "react";

export default function useCalificationDraft() {
  const saveDraft = useCallback((draft: Omit<CalificationDraft, "updatedAt">) => {
    calificationDraftStorage.saveDraft(draft);
  }, []);

  const loadDraft = useCallback((evaluationId: string, enrollmentId: string) => {
    return calificationDraftStorage.loadDraft(evaluationId, enrollmentId);
  }, []);

  const hasDraft = useCallback((evaluationId: string, enrollmentId: string) => {
    return calificationDraftStorage.hasDraft(evaluationId, enrollmentId);
  }, []);

  const clearDraft = useCallback((evaluationId: string, enrollmentId: string) => {
    calificationDraftStorage.clearDraft(evaluationId, enrollmentId);
  }, []);

  return { saveDraft, loadDraft, hasDraft, clearDraft };
}