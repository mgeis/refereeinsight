import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const prisma = await getPrisma();
  const positions = await prisma.position.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(positions);
}
