import { NextRequest, NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

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
                'options', CASE 
                  WHEN form_fields.options IS NULL THEN NULL
                  ELSE form_fields.options::json
                END,
                'order', form_fields.order,
                'required', form_fields.required,
                'value', form_fields.value
              )
              ORDER BY form_fields.order
            ) FILTER (WHERE form_fields.id IS NOT NULL),
            '[]'
          ) as fields
        `)
      )
      .where("forms.share_code", code)
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
    console.error("Error fetching form by share code:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}