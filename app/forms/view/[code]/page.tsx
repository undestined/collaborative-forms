"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { FormRenderer } from "@/components/forms/form-renderer";
import { Form } from "@/types";
import { SocketProvider, useSocketContext } from "@/lib/socket-context";
import { useAuth } from "@/hooks/use-auth";

function ShareFormContent() {
  const params = useParams();
  const code = params.code as string;
  const {
    isConnected,
    joinForm,
    leaveForm,
    collaborators,
    onFieldUpdate,
    offFieldUpdate,
  } = useSocketContext();
  const { user } = useAuth();

  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    if (form && isConnected) {
      joinForm(form.id, user?.id, user?.email);
    }

    return () => {
      if (form) {
        leaveForm(form.id, "temp-user-id");
      }
    };
  }, [form, isConnected, joinForm, leaveForm, user?.email, user?.id]);

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

        const updatedFields = (prev.fields || []).map(field => 
          field.id === data.fieldId 
            ? { ...field, value: data.value }
            : field
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


  const handleFieldChange = () => {
    // View mode is read-only, no field changes allowed
  };

  // Form submission handler (disabled in view mode)
  const handleSubmit = async () => {
    // View mode doesn't allow submission
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
        isLoading={false}
        collaborators={collaborators}
        editable={false}
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
