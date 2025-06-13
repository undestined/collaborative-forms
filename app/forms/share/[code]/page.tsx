"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { FormRenderer } from "@/components/forms/form-renderer";
import { Form, FormResponse, FieldValue } from "@/types";
import { SocketProvider, useSocketContext } from "@/lib/socket-context";

function ShareFormContent() {
  const params = useParams();
  const code = params.code as string;
  const { isConnected, joinForm, leaveForm, emitFieldUpdate, collaborators, onFieldUpdate, offFieldUpdate } = useSocketContext();

  const [form, setForm] = useState<Form | null>(null);
  const [response, setResponse] = useState<FormResponse | null>(null);
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

        // Create a new response for this user
        await createResponse(formData.id);
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
    if (form && isConnected) {
      joinForm(form.id, "temp-user-id", "temp@email.com");
    }

    return () => {
      if (form) {
        leaveForm(form.id, "temp-user-id");
      }
    };
  }, [form, isConnected, joinForm, leaveForm]);

  // Listen for field updates from other users
  useEffect(() => {
    const handleFieldUpdate = (data: { responseId: string; fieldId: string; value: string; userId?: string }) => {
      console.log("Received field update:", data);
      setResponse((prev) => {
        if (!prev) return prev;

        const updatedFieldValues = prev.field_values || [];
        const existingIndex = updatedFieldValues.findIndex(
          (fv: FieldValue) => fv.field_id === data.fieldId
        );

        if (existingIndex >= 0) {
          updatedFieldValues[existingIndex] = {
            ...updatedFieldValues[existingIndex],
            value: data.value,
            updated_at: new Date(),
          };
        } else {
          updatedFieldValues.push({
            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            response_id: data.responseId,
            field_id: data.fieldId,
            value: data.value,
            updated_by: data.userId,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }

        return {
          ...prev,
          field_values: updatedFieldValues,
        };
      });
    };

    onFieldUpdate(handleFieldUpdate);

    return () => {
      offFieldUpdate(handleFieldUpdate);
    };
  }, [onFieldUpdate, offFieldUpdate]);

  const createResponse = async (formId: string) => {
    try {
      const response = await fetch(`/api/forms/${formId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        setResponse(responseData);
      }
    } catch (error) {
      console.error("Error creating response:", error);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    if (!response || !form) return;

    // Emit real-time update via Socket.io
    emitFieldUpdate({
      formId: form.id,
      responseId: response.id,
      fieldId,
      value,
      userId: "temp-user-id", // TODO: Replace with actual user ID
    });

    // Update local state
    setResponse((prev) => {
      if (!prev) return prev;

      const updatedFieldValues = prev.field_values || [];
      const existingIndex = updatedFieldValues.findIndex(
        (fv: FieldValue) => fv.field_id === fieldId
      );

      if (existingIndex >= 0) {
        updatedFieldValues[existingIndex] = {
          ...updatedFieldValues[existingIndex],
          value,
          updated_at: new Date(),
        };
      } else {
        updatedFieldValues.push({
          id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          response_id: response.id,
          field_id: fieldId,
          value,
          updated_by: "temp-user", // TODO: Replace with actual user ID
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      return {
        ...prev,
        field_values: updatedFieldValues,
      };
    });
  };

  // Form submission handler
  const handleSubmit = async (values: Record<string, string | undefined>) => {
    if (!form || !response) return;

    try {
      setIsSubmitting(true);

      // TODO: Implement form submission logic
      console.log("Form submitted:", values);

      // Show success message
      alert("Form submitted successfully!");
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit form. Please try again.");
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
        response={response || undefined}
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
    <SocketProvider>
      <ShareFormContent />
    </SocketProvider>
  );
}
