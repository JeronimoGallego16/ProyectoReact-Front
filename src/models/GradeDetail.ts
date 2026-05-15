export interface GradeDetail {
    id: string;
    student_id: string;
    scale_id: string;
    score: number;
    comment?: string | null;
    created_at: string;
    updated_at: string;
}