import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import { updateFormSchema, type FormFieldData } from "@/lib/validations/forms";
import { withAuth } from "@/lib/middleware/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if form exists and user has access to it
    const existingForm = await db("forms")
      .where("id", id)
      .first();

    if (!existingForm) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const form = await db("forms")
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
      .where("forms.id", id)
      .groupBy("forms.id")
      .first();

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (authenticatedRequest) => {
  try {
    const { id } = await params;
    
    // Check if form exists and user owns it
    const existingForm = await db("forms")
      .where("id", id)
      .where("admin_id", authenticatedRequest.user.id)
      .first();

    if (!existingForm) {
      return NextResponse.json(
        { error: "Form not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const result = updateFormSchema.safeParse({ ...body, id });
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

    const trx = await db.transaction();

    try {
      await trx("forms")
        .where("id", id)
        .update({
          title,
          description,
          updated_at: new Date(),
        });

      if (fields) {
        await trx("form_fields").where("form_id", id).del();
        
        if (fields.length > 0) {
          const formFields = fields.map((field: FormFieldData, index: number) => ({
            form_id: id,
            field_type: field.field_type,
            label: field.label,
            options: field.options ? JSON.stringify(field.options) : null,
            order: field.order || index,
            required: field.required || false,
          }));

          await trx("form_fields").insert(formFields);
        }
      }

      await trx.commit();

      const updatedForm = await db("forms")
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
        .where("forms.id", id)
        .groupBy("forms.id")
        .first();

      return NextResponse.json(updatedForm);
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (authenticatedRequest) => {
  try {
    const { id } = await params;

    // Check if form exists and user owns it
    const existingForm = await db("forms")
      .where("id", id)
      .where("admin_id", authenticatedRequest.user.id)
      .first();

    if (!existingForm) {
      return NextResponse.json(
        { error: "Form not found or access denied" },
        { status: 404 }
      );
    }

    const trx = await db.transaction();

    try {
      await trx("field_values")
        .whereIn("response_id", 
          trx("form_responses").select("id").where("form_id", id)
        )
        .del();

      await trx("form_responses").where("form_id", id).del();
      await trx("form_fields").where("form_id", id).del();
      await trx("forms").where("id", id).del();

      await trx.commit();

      return NextResponse.json({ message: "Form deleted successfully" });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
  });
}