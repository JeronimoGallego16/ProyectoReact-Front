import { LocalStorageProvider } from "../storage/LocalStorageProvider";
import { StorageProvider } from "../storage/StorageProvider";

export interface CalificationDraft {
    evaluationId: string;
    enrollmentId: string;
    studentCode: string;
    selectedScales: Record<string, string>;
    criterionComments: Record<string, string>;
    updatedAt: string;
}

class CalificationDraftStorage {
    private readonly storage: StorageProvider;
    private readonly keyPrefix = "calification_draft";

    constructor(storage: StorageProvider = new LocalStorageProvider()) {
        this.storage = storage;
    }

    private buildKey(evaluationId: string, enrollmentId: string): string {
        return `${this.keyPrefix}:${evaluationId}:${enrollmentId}`;
    }

    saveDraft(draft: Omit<CalificationDraft, "updatedAt">): void {
        const payload: CalificationDraft = {
            ...draft,
            updatedAt: new Date().toISOString(),
        };

        this.storage.setItem(this.buildKey(payload.evaluationId, payload.enrollmentId), JSON.stringify(payload));
    }

    loadDraft(evaluationId: string, enrollmentId: string): CalificationDraft | null {
        const rawDraft = this.storage.getItem(this.buildKey(evaluationId, enrollmentId));

        if (!rawDraft) {
            return null;
        }

        try {
            const parsed = JSON.parse(rawDraft) as CalificationDraft;

            if (!parsed || parsed.evaluationId !== evaluationId || parsed.enrollmentId !== enrollmentId) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    hasDraft(evaluationId: string, enrollmentId: string): boolean {
        return this.loadDraft(evaluationId, enrollmentId) !== null;
    }

    clearDraft(evaluationId: string, enrollmentId: string): void {
        this.storage.removeItem(this.buildKey(evaluationId, enrollmentId));
    }
}

export const calificationDraftStorage = new CalificationDraftStorage();