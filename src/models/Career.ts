export interface Career {
  code: string;
  created_at?: string;
  description?: string;
  id: string;
  is_active: boolean;
  name: string;
  updated_at?: string;
}

export type CareerCreateInput = Omit<Career, 'id' | 'created_at' | 'updated_at'>;
export type CareerUpdateInput = Partial<CareerCreateInput>;
