"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import {
  createFormSchema,
  type CreateFormData,
  type FieldType,
} from "@/lib/validations/forms";
import { useState } from "react";

interface FormCreatorProps {
  onSubmit: (formData: CreateFormData) => Promise<void>;
  isLoading?: boolean;
}

export function FormCreator({ onSubmit, isLoading = false }: FormCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateFormData>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      title: "",
      description: "",
      fields: [],
    },
  });

  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const addField = (fieldType: FieldType) => {
    const newField = {
      field_type: fieldType,
      label: `New ${fieldType} field`,
      required: false,
      order: fields.length,
      options:
        fieldType === "select" || fieldType === "radio"
          ? ["Option 1"]
          : undefined,
    };
    append(newField);
  };

  const addOption = (fieldIndex: number) => {
    const currentOptions = form.getValues(`fields.${fieldIndex}.options`) || [];
    form.setValue(`fields.${fieldIndex}.options`, [
      ...currentOptions,
      `Option ${currentOptions.length + 1}`,
    ], {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };


  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const currentOptions = form.getValues(`fields.${fieldIndex}.options`) || [];
    if (currentOptions.length > 1) {
      form.setValue(
        `fields.${fieldIndex}.options`,
        currentOptions.filter((_, i) => i !== optionIndex),
        {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        }
      );
    }
  };

  const handleSubmit = async (values: CreateFormData) => {
    try {
      // Ensure field order is correct
      const formData = {
        ...values,
        fields: values.fields.map((field, index) => ({
          ...field,
          order: index,
        })),
      };
      await onSubmit(formData);
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating form:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Form
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Form</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter form title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter form description"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Form Fields</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addField("text")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No fields added yet. Click &quot;Add Field&quot; to start building your form.
                </div>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id || index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1 mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => index > 0 && move(index, index - 1)}
                          disabled={index === 0}
                        >
                          <GripVertical className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`fields.${index}.field_type`}
                            render={({ field: typeField }) => (
                              <FormItem>
                                <FormControl>
                                  <Select
                                    value={typeField.value}
                                    onValueChange={(value) => {
                                      typeField.onChange(value);
                                      // Reset options when changing field type
                                      if (value === "select" || value === "radio") {
                                        update(index, {
                                          ...fields[index],
                                          field_type: value as FieldType,
                                          options: ["Option 1"]
                                        });
                                      } else {
                                        update(index, {
                                          ...fields[index],
                                          field_type: value as FieldType,
                                          options: undefined
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-[150px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text Input</SelectItem>
                                      <SelectItem value="textarea">Text Area</SelectItem>
                                      <SelectItem value="select">Select Dropdown</SelectItem>
                                      <SelectItem value="radio">Radio Buttons</SelectItem>
                                      <SelectItem value="checkbox">Checkbox</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div className="flex items-center gap-2 ml-auto">
                            <FormField
                              control={form.control}
                              name={`fields.${index}.required`}
                              render={({ field: requiredField }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={!!requiredField.value}
                                      onCheckedChange={requiredField.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    Required
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name={`fields.${index}.label`}
                          render={({ field: labelField }) => (
                            <FormItem>
                              <FormLabel>Field Label</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter field label"
                                  value={labelField.value || ""}
                                  onChange={labelField.onChange}
                                  onBlur={labelField.onBlur}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {(field.field_type === "select" ||
                          field.field_type === "radio") && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            <div className="space-y-2">
                              {form.watch(`fields.${index}.options`)?.map((_, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="flex items-center gap-2"
                                >
                                  <FormField
                                    control={form.control}
                                    name={`fields.${index}.options.${optionIndex}`}
                                    render={({ field: optionField }) => (
                                      <FormItem className="flex-1">
                                        <FormControl>
                                          <Input
                                            placeholder={`Option ${optionIndex + 1}`}
                                            {...optionField}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  {form.watch(`fields.${index}.options`) &&
                                    form.watch(`fields.${index}.options`)!.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeOption(index, optionIndex)
                                        }
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(index)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}