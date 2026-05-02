export interface Grade {
    id: string;
    student_id?: string;
    registration_id?: string;
    rubric_id?: string;
    final_grade?: number;
    is_locked?: boolean;
}