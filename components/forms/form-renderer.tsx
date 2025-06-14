"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { Form as FormType, FormField as FormFieldType, FormResponse } from "@/types";

interface FormRendererProps {
  form: FormType;
  response?: FormResponse;
  onFieldChange?: (fieldId: string, value: string) => void;
  onSubmit?: (values: Record<string, string | undefined>) => void | Promise<void>;
  isLoading?: boolean;
  collaborators?: { userId: string; email: string }[];
  editable?: boolean;
}

export function FormRenderer({ 
  form, 
  response, 
  onFieldChange, 
  onSubmit, 
  isLoading = false,
  collaborators = [],
  editable = true
}: FormRendererProps) {

  // Create dynamic schema based on form fields
  const createSchema = () => {
    const schemaFields: Record<string, z.ZodString | z.ZodOptional<z.ZodString>> = {};
    
    form.fields?.forEach((field: FormFieldType) => {
      let fieldSchema: z.ZodString;
      
      switch (field.field_type) {
        case "email":
          fieldSchema = z.string().email("Please enter a valid email");
          break;
        case "number":
          fieldSchema = z.string().regex(/^\d+$/, "Please enter a valid number");
          break;
        case "date":
          fieldSchema = z.string().min(1, "Please select a date");
          break;
        default:
          fieldSchema = z.string();
      }
      
      if (!field.required) {
        schemaFields[field.id] = fieldSchema.optional();
      } else {
        schemaFields[field.id] = fieldSchema.min(1, `${field.label} is required`);
      }
    });
    
    return z.object(schemaFields);
  };

  const formSchema = createSchema();
  
  // Initialize default values for all fields to prevent controlled/uncontrolled switching
  const getDefaultValues = () => {
    const defaults: Record<string, string> = {};
    form.fields?.forEach((field: FormFieldType) => {
      defaults[field.id] = "";
    });
    return defaults;
  };

  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (response) {
      const values: Record<string, string> = {};
      // Initialize all fields with empty strings first
      form.fields?.forEach((field: FormFieldType) => {
        values[field.id] = "";
      });
      // Then override with actual values
      response.field_values?.forEach((fv) => {
        if (fv.field_id) {
          values[fv.field_id] = fv.value || "";
        }
      });
      formMethods.reset(values);
    }
  }, [response, formMethods, form.fields]);

  const handleFieldChange = (fieldId: string, value: string) => {
    onFieldChange?.(fieldId, value);
  };

  const renderField = (field: FormFieldType) => {
    const fieldId = field.id;
    
    return (
      <FormField
        key={fieldId}
        control={formMethods.control}
        name={fieldId}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              {(() => {
                switch (field.field_type) {
                  case "textarea":
                    return (
                      <Textarea
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        {...formField}
                        value={formField.value ?? ""}
                        onChange={(e) => {
                          formField.onChange(e);
                          handleFieldChange(fieldId, e.target.value);
                        }}
                        disabled={!editable}
                      />
                    );
                  
                  case "select":
                    return (
                      <Select
                        value={formField.value ?? ""}
                        onValueChange={(value) => {
                          formField.onChange(value);
                          handleFieldChange(fieldId, value);
                        }}
                        disabled={!editable}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  
                  case "radio":
                    return (
                      <div className="space-y-2">
                        {field.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`${fieldId}-${index}`}
                              name={fieldId}
                              value={option}
                              checked={(formField.value ?? "") === option}
                              onChange={(e) => {
                                formField.onChange(e.target.value);
                                handleFieldChange(fieldId, e.target.value);
                              }}
                              className="w-4 h-4"
                              disabled={!editable}
                            />
                            <label
                              htmlFor={`${fieldId}-${index}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    );
                  
                  case "checkbox":
                    return (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={fieldId}
                          checked={(formField.value ?? "") === "true"}
                          onChange={(e) => {
                            const value = e.target.checked.toString();
                            formField.onChange(value);
                            handleFieldChange(fieldId, value);
                          }}
                          className="w-4 h-4"
                          disabled={!editable}
                        />
                        <label
                          htmlFor={fieldId}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {field.label}
                        </label>
                      </div>
                    );
                  
                  default:
                    return (
                      <Input
                        type={field.field_type === "email" ? "email" : 
                              field.field_type === "number" ? "number" : 
                              field.field_type === "date" ? "date" : "text"}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        {...formField}
                        value={formField.value ?? ""}
                        onChange={(e) => {
                          formField.onChange(e);
                          handleFieldChange(fieldId, e.target.value);
                        }}
                        disabled={!editable}
                      />
                    );
                }
              })()}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const handleSubmit = (values: Record<string, string | undefined>) => {
    onSubmit?.(values);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{form.title}</CardTitle>
              {form.description && (
                <CardDescription className="mt-2 text-base">
                  {form.description}
                </CardDescription>
              )}
            </div>
            {collaborators.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {collaborators.length} collaborator{collaborators.length > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(handleSubmit)} className="space-y-6">
              {form.fields?.map((field) => renderField(field))}
              
              {onSubmit && editable && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit Form"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {collaborators.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Active Collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {collaborators.map((collaborator) => (
                <Badge key={collaborator.userId} variant="outline">
                  {collaborator.email}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}