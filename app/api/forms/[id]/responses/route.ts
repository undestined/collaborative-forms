import { NextRequest, NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;

    const responses = await db("form_responses")
      .leftJoin("field_values", "form_responses.id", "field_values.response_id")
      .leftJoin("form_fields", "field_values.field_id", "form_fields.id")
      .select(
        "form_responses.id as response_id",
        "form_responses.created_at",
        "form_responses.updated_at",
        db.raw(`
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'field_id', form_fields.id,
                'field_type', form_fields.field_type,
                'label', form_fields.label,
                'value', field_values.value,
                'updated_by', field_values.updated_by,
                'updated_at', field_values.updated_at
              )
              ORDER BY form_fields.order
            ) FILTER (WHERE form_fields.id IS NOT NULL),
            '[]'
          ) as field_values
        `)
      )
      .where("form_responses.form_id", formId)
      .groupBy("form_responses.id", "form_responses.created_at", "form_responses.updated_at")
      .orderBy("form_responses.created_at", "desc");

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching form responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch form responses" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;

    const [response] = await db("form_responses")
      .insert({
        form_id: formId,
      })
      .returning("*");

    // Return response with empty field_values array to match frontend expectations
    const responseWithFieldValues = {
      ...response,
      field_values: []
    };

    return NextResponse.json(responseWithFieldValues, { status: 201 });
  } catch (error) {
    console.error("Error creating form response:", error);
    return NextResponse.json(
      { error: "Failed to create form response" },
      { status: 500 }
    );
  }
}