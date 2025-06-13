import { z } from "zod";

// Form field types
export const fieldTypeSchema = z.enum([
  "text",
  "textarea", 
  "select",
  "radio",
  "checkbox",
  "number",
  "email",
  "date"
]);

// Individual field schema
export const formFieldSchema = z.object({
  field_type: fieldTypeSchema,
  label: z.string().min(1, "Field label is required"),
  required: z.boolean(),
  order: z.number().int().min(0),
  options: z.array(z.string().min(1, "Option cannot be empty")).optional(),
}).refine(
  (data) => {
    // Validate that select and radio fields have at least one option
    if (["select", "radio"].includes(data.field_type)) {
      return data.options && data.options.length > 0;
    }
    return true;
  },
  {
    message: "Select and radio fields must have at least one option",
    path: ["options"],
  }
);

// Form creation schema
export const createFormSchema = z.object({
  title: z.string().min(1, "Form title is required").max(255, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  fields: z.array(formFieldSchema).min(1, "Form must have at least one field"),
});

// Form update schema (allows partial updates)
export const updateFormSchema = createFormSchema.partial().extend({
  id: z.string().uuid("Invalid form ID"),
});

// Field value validation based on field type
export const fieldValueSchema = z.object({
  field_id: z.string().uuid("Invalid field ID"),
  value: z.string().optional(),
  field_type: fieldTypeSchema,
}).refine(
  (data) => {
    // Validate field value based on type
    if (!data.value) return true; // Allow empty values (handled by required validation)
    
    switch (data.field_type) {
      case "email":
        return z.string().email().safeParse(data.value).success;
      case "number":
        return !isNaN(Number(data.value));
      case "date":
        return !isNaN(Date.parse(data.value));
      default:
        return true;
    }
  },
  {
    message: "Invalid value for field type",
    path: ["value"],
  }
);

// Form response submission schema
export const submitFormResponseSchema = z.object({
  form_id: z.string().uuid("Invalid form ID"),
  field_values: z.array(fieldValueSchema),
});

// Type exports
export type FieldType = z.infer<typeof fieldTypeSchema>;
export type FormFieldData = z.infer<typeof formFieldSchema>;
export type CreateFormData = z.infer<typeof createFormSchema>;
export type UpdateFormData = z.infer<typeof updateFormSchema>;
export type FieldValueData = z.infer<typeof fieldValueSchema>;
export type SubmitFormResponseData = z.infer<typeof submitFormResponseSchema>;