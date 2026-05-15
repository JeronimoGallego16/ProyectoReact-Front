import { GradeDetail } from './GradeDetail';

export interface Grade {
    id: string;
    enrollment_id: string;
    rubric_id: string;
    final_score: number;
    status: 'DRAFT' | 'SENT' | 'APPROVED';
    observations?: string | null;
    is_locked: boolean;
    details: GradeDetail[];
    created_at: string;
    updated_at: string;
}