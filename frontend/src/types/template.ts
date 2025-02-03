export interface TemplateVariable {
  name: string;
  field: string;  // Maps to customer field
  type: 'string' | 'number' | 'date';
  required: boolean;
  defaultValue?: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  variables: TemplateVariable[];
  created_at: string;
  updated_at: string;
  author?: string;
  isPrivate?: boolean;
  attachments?: string[];
}

export interface TemplatePreview {
  phoneNumber: string;
  content: string;
  variables: Record<string, string>;
}
