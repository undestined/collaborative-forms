import { NextRequest, NextResponse } from "next/server";
import db from "../../../../../../../lib/db";
import { submitFormResponseSchema } from "../../../../../../../lib/validations/forms";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id: formId, responseId } = await params;
    const body = await request.json();

    // Validate the request body
    const validatedData = submitFormResponseSchema.parse({
      form_id: formId,
      field_values: body.field_values || []
    });

    // Start a database transaction
    await db.transaction(async (trx) => {
      // Update the form response with submitted status
      await trx("form_responses")
        .where({ id: responseId, form_id: formId })
        .update({
          updated_at: new Date(),
          // You could add a status field like 'submitted' if needed
        });

      // Upsert all field values
      for (const fieldValue of validatedData.field_values) {
        await trx("field_values")
          .insert({
            response_id: responseId,
            field_id: fieldValue.field_id,
            value: fieldValue.value || null,
            updated_by: body.updated_by || null,
            updated_at: new Date(),
          })
          .onConflict(['response_id', 'field_id'])
          .merge({
            value: fieldValue.value || null,
            updated_by: body.updated_by || null,
            updated_at: new Date(),
          });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully"
    });

  } catch (error) {
    console.error("Error submitting form:", error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: "Invalid form data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}