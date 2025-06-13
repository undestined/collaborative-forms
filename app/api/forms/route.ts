import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import db from "@/lib/db";
import { createFormSchema } from "@/lib/validations/forms";

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedRequest) => {
    try {
      // Only fetch forms for the authenticated user
      const forms = await db("forms")
        .select("*")
        .where("admin_id", authenticatedRequest.user.id)
        .orderBy("created_at", "desc");
      
      return NextResponse.json(forms);
    } catch (error) {
      console.error("Error fetching forms:", error);
      return NextResponse.json(
        { error: "Failed to fetch forms" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedRequest) => {
    try {
      const body = await request.json();
      
      // Validate request body
      const result = createFormSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { 
            error: "Invalid input", 
            details: result.error.errors 
          },
          { status: 400 }
        );
      }

      const { title, description, fields } = result.data;
      const admin_id = authenticatedRequest.user.id;

      const trx = await db.transaction();

      try {
        const share_code = Math.random().toString(36).substring(2, 15);
        
        const [form] = await trx("forms")
          .insert({
            title,
            description,
            admin_id,
            share_code,
          })
          .returning("*");

        if (fields && fields.length > 0) {
          const formFields = fields.map((field, index) => ({
            form_id: form.id,
            field_type: field.field_type,
            label: field.label,
            options: field.options ? JSON.stringify(field.options) : null,
            order: field.order || index,
            required: field.required || false,
          }));

          await trx("form_fields").insert(formFields);
        }

        await trx.commit();

        const formWithFields = await db("forms")
          .leftJoin("form_fields", "forms.id", "form_fields.form_id")
          .select(
            "forms.*",
            db.raw(`
              COALESCE(
                JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'id', form_fields.id,
                    'field_type', form_fields.field_type,
                    'label', form_fields.label,
                    'options', form_fields.options,
                    'order', form_fields.order,
                    'required', form_fields.required
                  )
                  ORDER BY form_fields.order
                ) FILTER (WHERE form_fields.id IS NOT NULL),
                '[]'
              ) as fields
            `)
          )
          .where("forms.id", form.id)
          .groupBy("forms.id")
          .first();

        return NextResponse.json(formWithFields, { status: 201 });
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error("Error creating form:", error);
      return NextResponse.json(
        { error: "Failed to create form" },
        { status: 500 }
      );
    }
  });
}