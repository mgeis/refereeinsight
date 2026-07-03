import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; misconductId: string }> }) {
  const { misconductId } = await params;
  const prisma = await getPrisma();
  await prisma.misconduct.delete({ where: { id: Number(misconductId) } });
  return NextResponse.json({ deleted: true });
}
