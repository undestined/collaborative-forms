export interface User {
  id: string;
  email: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  admin_id: string;
  share_code: string;
  fields?: FormField[];
  created_at: Date;
  updated_at: Date;
}

export interface FormField {
  id: string;
  form_id: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'email' | 'date';
  label: string;
  options?: string[]; // For select, radio, checkbox options
  order: number;
  required: boolean;
  value?: string; // Current field value
  created_at: Date;
  updated_at: Date;
}

export interface FormResponse {
  id: string;
  form_id: string;
  field_values?: FieldValue[];
  created_at: Date;
  updated_at: Date;
}

export interface FieldValue {
  id: string;
  response_id: string;
  field_id: string;
  value?: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Socket.io event types
export interface SocketEvents {
  'field-update': (data: {
    responseId: string;
    fieldId: string;
    value: string;
    userId?: string;
  }) => void;
  'user-joined': (data: {
    userId: string;
    email: string;
    formId: string;
  }) => void;
  'user-left': (data: {
    userId: string;
    formId: string;
  }) => void;
}

// Form creation/editing types
export interface CreateFormData {
  title: string;
  description?: string;
  fields: Omit<FormField, 'id' | 'form_id' | 'created_at' | 'updated_at'>[];
}

export interface FormWithFields extends Form {
  fields: FormField[];
}

export interface ResponseWithValues extends FormResponse {
  values: FieldValue[];
}