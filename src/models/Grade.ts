export interface Grade {
    id: string;
<<<<<<< HEAD
    enrollment_id: string;
    rubric_id: string;
    final_score: number;
    status: 'DRAFT' | 'SENT' | 'APPROVED';
    observations?: string | null;
    is_locked: boolean;
    details: GradeDetail[];
    created_at?: string;
    updated_at?: string;
=======
    student_id?: string;
    registration_id?: string;
    rubric_id?: string;
    final_grade?: number;
    is_locked?: boolean;
>>>>>>> 30dc716ceb9a5057a59ad2d05c2fa23c73d28ea3
}