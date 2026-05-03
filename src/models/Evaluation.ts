export interface Evaluation {
    id: string;
    rubric_id?: string;
    subject_id?: string;
    group_id?: string;
    name?: string;
    description?: string;
    weight?: number;
    created_at?: string;
    updated_at?: string;
}