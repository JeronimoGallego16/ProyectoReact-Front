export interface StudyPlan {
  id: string;
  career_id: string;
  subject_id: string;
  name: string;
  year: number;
  suggested_semester: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}
