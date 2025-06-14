"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { FormRenderer } from "@/components/forms/form-renderer";
import { Form } from "@/types";
import { SocketProvider, useSocketContext } from "@/lib/socket-context";
import { ProtectedRoute } from "@/components/ui/protected-route";
import { useAuth } from "@/hooks/use-auth";

function ShareFormContent() {
  const params = useParams();
  const code = params.code as string;
  const {
    isConnected,
    joinForm,
    leaveForm,
    emitFieldUpdate,
    collaborators,
    onFieldUpdate,
    offFieldUpdate,
  } = useSocketContext();
  const { user } = useAuth();

  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/forms/share/${code}`);
      if (response.ok) {
        const formData = await response.json();
        setForm(formData);
      } else if (response.status === 404) {
        setError("Form not found. Please check the share code and try again.");
      } else {
        setError("Failed to load form. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching form:", error);
      setError("Failed to load form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      fetchForm();
    }
  }, [code, fetchForm]);

  // Join form room when form is loaded and socket is connected
  useEffect(() => {
    if (form?.id && isConnected) {
      joinForm(form.id, user?.id, user?.email);
    }

    return () => {
      if (form?.id) {
        leaveForm(form.id, user?.id || "anonymous");
      }
    };
  }, [form?.id, isConnected, joinForm, leaveForm, user?.id, user?.email]);

  // Listen for field updates from other users
  useEffect(() => {
    const handleFieldUpdate = (data: {
      fieldId: string;
      value: string;
      userId?: string;
    }) => {
      console.log("Received field update:", data);
      setForm((prev) => {
        if (!prev) return prev;

        const updatedFields = (prev.fields || []).map((field) =>
          field.id === data.fieldId ? { ...field, value: data.value } : field
        );

        return {
          ...prev,
          fields: updatedFields,
        };
      });
    };

    onFieldUpdate(handleFieldUpdate);

    return () => {
      offFieldUpdate(handleFieldUpdate);
    };
  }, [onFieldUpdate, offFieldUpdate]);

  const handleFieldChange = (fieldId: string, value: string) => {
    if (!form) return;

    // Emit real-time update via Socket.io
    emitFieldUpdate({
      formId: form.id,
      fieldId,
      value,
      userId: user?.id,
    });

    // Update local state
    setForm((prev) => {
      if (!prev) return prev;

      const updatedFields = (prev.fields || []).map((field) =>
        field.id === fieldId ? { ...field, value } : field
      );

      return {
        ...prev,
        fields: updatedFields,
      };
    });
  };

  // Form submission handler
  const handleSubmit = async (values: Record<string, string | undefined>) => {
    if (!form || !user) return;

    try {
      setIsSubmitting(true);

      // Step 1: Create a form response
      const responseResult = await fetch(`/api/forms/${form.id}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!responseResult.ok) {
        const errorData = await responseResult.json();
        throw new Error(errorData.error || "Failed to create form response");
      }

      const responseData = await responseResult.json();
      const responseId = responseData.id;

      // Step 2: Submit field values
      const fieldValues = (form.fields || []).map((field) => ({
        field_id: field.id,
        value: values[field.id] || field.value || "",
        field_type: field.field_type,
      }));

      const submitResponse = await fetch(
        `/api/forms/${form.id}/responses/${responseId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            field_values: fieldValues,
            updated_by: user.id,
          }),
        }
      );

      if (submitResponse.ok) {
        // Update form state with submitted values
        setForm((prev) => {
          if (!prev) return prev;

          const updatedFields = (prev.fields || []).map((field) => ({
            ...field,
            value: values[field.id] || field.value || "",
          }));

          return {
            ...prev,
            fields: updatedFields,
          };
        });

        alert("Form submitted successfully!");
      } else {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        `Failed to submit form: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-muted rounded-lg h-64 mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted rounded h-12"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchForm}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Form not found</h1>
          <p className="text-muted-foreground">
            The form you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <FormRenderer
        form={form}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        collaborators={collaborators}
      />
    </div>
  );
}

export default function ShareFormPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <SocketProvider>
        <ShareFormContent />
      </SocketProvider>
    </ProtectedRoute>
  );
}
