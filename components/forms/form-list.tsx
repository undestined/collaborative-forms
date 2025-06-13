"use client";

import { useState } from "react";
import { Edit, Trash2, Share2, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Form } from "@/types";

interface FormListProps {
  forms: Form[];
  onEdit?: (form: Form) => void;
  onDelete?: (formId: string) => void;
  isLoading?: boolean;
}

export function FormList({
  forms,
  onEdit,
  onDelete,
  isLoading = false,
}: FormListProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);

  const handleShare = (form: Form) => {
    setSelectedForm(form);
    setShareDialogOpen(true);
  };

  const copyShareLink = () => {
    if (selectedForm) {
      const shareUrl = `${window.location.origin}/forms/share/${selectedForm.share_code}`;
      navigator.clipboard.writeText(shareUrl);
      // TODO: Add toast notification
    }
  };

  const openShareLink = () => {
    if (selectedForm) {
      const shareUrl = `${window.location.origin}/forms/share/${selectedForm.share_code}`;
      window.open(shareUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No forms yet
        </h3>
        <p className="text-muted-foreground">
          Create your first form to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Card key={form.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  {form.description && (
                    <CardDescription className="mt-1">
                      {form.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="outline" className="ml-2">
                  {form.fields?.length || 0} fields
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(form.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(form)}
                    title="Share form"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(form)}
                      title="Edit form"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(form.id)}
                      title="Delete form"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Form</DialogTitle>
            <DialogDescription>
              Share this form with others using the link below. Anyone with this
              link can fill out the form.
            </DialogDescription>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-url">Share URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="share-url"
                    value={`${window.location.origin}/forms/share/${selectedForm.share_code}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyShareLink}
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openShareLink}
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Share Code</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={selectedForm.share_code}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(selectedForm.share_code)
                    }
                    title="Copy code"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Users can also enter this code directly on your site.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
