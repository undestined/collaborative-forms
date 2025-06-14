"use client";

import { useState, useEffect } from "react";
import { FormCreator } from "@/components/forms/form-creator";
import { FormList } from "@/components/forms/form-list";
import { ProtectedRoute } from "@/components/ui/protected-route";
import { Form } from "@/types";
import { CreateFormData } from "@/lib/validations/forms";
import { useAuth } from "@/hooks/use-auth";

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/forms");
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      } else {
        console.error("Failed to fetch forms");
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateForm = async (formData: CreateFormData) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          admin_id: user.id,
        }),
      });

      if (response.ok) {
        const newForm = await response.json();
        setForms([newForm, ...forms]);
      } else {
        const error = await response.json();
        console.error("Failed to create form:", error);
        throw new Error(error.error || "Failed to create form");
      }
    } catch (error) {
      console.error("Error creating form:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setForms(forms.filter(form => form.id !== formId));
      } else {
        const error = await response.json();
        console.error("Failed to delete form:", error);
      }
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  };

  const handleEditForm = (form: Form) => {
    // TODO: Implement form editing
    console.log("Edit form:", form);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Forms</h1>
          <p className="text-muted-foreground">
            Create and manage your collaborative forms
          </p>
        </div>
        <FormCreator onSubmit={handleCreateForm} isLoading={isCreating} />
      </div>

      <FormList
        forms={forms}
        onEdit={handleEditForm}
        onDelete={handleDeleteForm}
        isLoading={isLoading}
      />
      </div>
    </ProtectedRoute>
  );
}