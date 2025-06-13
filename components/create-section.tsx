"use client";

import React from "react";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui/button";

export default function CreateSection() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">Ready to start collaborating?</h2>
      <p className="text-muted-foreground mb-8">
        Join thousands of teams already using FormSync for their collaborative
        form needs.
      </p>
      <Link href="/forms">
        <Button size="lg" className="text-lg px-12">
          Create Your First Form
        </Button>
      </Link>
    </div>
  );
}
