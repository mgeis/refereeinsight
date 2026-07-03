import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { type, recipientType, minute, number, name, reason, description } = body;

  if (!type || !recipientType || !minute || !name || !reason) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const prisma = await getPrisma();
  const misconduct = await prisma.misconduct.create({
    data: {
      matchReportId: Number(id),
      type,
      recipientType,
      minute: Number(minute),
      number: number || null,
      name,
      reason,
      description: description || null,
    },
  });

  return NextResponse.json(misconduct, { status: 201 });
}
