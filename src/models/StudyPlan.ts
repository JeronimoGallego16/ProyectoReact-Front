export interface StudyPlan {
  id: string;
  career_id: string;
  name: string;
  year: number;
  suggested_semester: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type StudyPlanCreateInput = Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'>;
export type StudyPlanUpdateInput = Partial<StudyPlanCreateInput>;
