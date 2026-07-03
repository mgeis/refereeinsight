import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { authProvider } from "@/lib/auth/index";
import { getSessionUserId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, username: true, ussfId: true, aysoId: true },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { firstName, lastName, username, ussfId, aysoId, newPassword } = await req.json();

  if (!firstName?.trim() || !lastName?.trim() || !username?.trim()) {
    return NextResponse.json({ error: "First name, last name, and username are required." }, { status: 400 });
  }

  const prisma = await getPrisma();
  const existing = await prisma.user.findFirst({
    where: { username: username.trim(), NOT: { id: userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const data: Record<string, string | null> = {
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    username:  username.trim(),
    ussfId:    ussfId?.trim()  || null,
    aysoId:    aysoId?.trim()  || null,
  };

  if (newPassword?.trim()) {
    await authProvider.changePassword(userId, newPassword.trim());
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, firstName: true, lastName: true, username: true, ussfId: true, aysoId: true },
  });

  return NextResponse.json(updated);
}
