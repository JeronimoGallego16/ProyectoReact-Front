import { GradeDetail } from './GradeDetail';

export interface Grade {
    id: string;
    enrollment_id?: string;
    rubric_id?: string;
    final_score?: number;
    details?: GradeDetail[];
    is_locked?: boolean;
    created_at?: string;
    updated_at?: string;
}