import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UsernameExistsException } from "@aws-sdk/client-cognito-identity-provider";
import { getPrisma } from "@/lib/db";
import { authProvider } from "@/lib/auth/index";
import { logEvent } from "@/lib/events";
import { acceptCurrentEula, getCurrentEula } from "@/lib/eula";
import { hashInviteCode } from "@/lib/inviteCodes";

export async function POST(req: NextRequest) {
  const { firstName, lastName, username, password, email, phone, ussfId, aysoId, eulaAccepted, inviteCode } = await req.json();

  if (!firstName?.trim() || !lastName?.trim() || !username?.trim() || !password || !email?.trim()) {
    return NextResponse.json({ error: "First name, last name, username, password, and email are required." }, { status: 400 });
  }
  if (!inviteCode?.trim()) {
    return NextResponse.json({ error: "An invite code is required to create an account." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }
  if (phone && !/^\+[1-9]\d{6,14}$/.test(phone.trim())) {
    return NextResponse.json({ error: "Phone number must be in E.164 format, e.g. +15551234567." }, { status: 400 });
  }
  if (eulaAccepted !== true) {
    return NextResponse.json({ error: "You must agree to the End User License Agreement to create an account." }, { status: 400 });
  }

  const prisma = await getPrisma();

  const trimmedEmail = email.trim().toLowerCase();
  const invite = await prisma.invite.findUnique({ where: { codeHash: hashInviteCode(inviteCode.trim()) } });
  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 400 });
  }
  if (invite.email.toLowerCase() !== trimmedEmail) {
    return NextResponse.json({ error: "This invite code is not valid for this email address." }, { status: 400 });
  }
  if (invite.consumedAt) {
    return NextResponse.json({ error: "This invite code has already been used." }, { status: 409 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite code has expired." }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: username.trim() }, { email: email.trim() }] },
  });
  if (existing) {
    return NextResponse.json({
      error: existing.username === username.trim() ? "That username is already taken." : "That email is already registered.",
    }, { status: 409 });
  }

  let signUpResult;
  try {
    signUpResult = await authProvider.signUp({
      username: username.trim(),
      password,
      email: email.trim(),
      phone: phone?.trim() || null,
    });
  } catch (err) {
    if (err instanceof UsernameExistsException) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    console.error("[signup]", err);
    return NextResponse.json({ error: "Sign up failed. Please try again." }, { status: 500 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      username:  username.trim(),
      email:     email.trim(),
      phone:     phone?.trim() || null,
      ussfId:    ussfId?.trim() || null,
      aysoId:    aysoId?.trim() || null,
      password:  hashed,
      cognitoSub: signUpResult.providerSub,
      roles: { connect: { name: "REFEREE" } },
    },
    select: { id: true, username: true },
  });

  await prisma.invite.update({ where: { id: invite.id }, data: { consumedAt: new Date() } });
  logEvent("USER_CREATED", { userId: user.id, username: user.username, needsConfirmation: signUpResult.needsConfirmation, inviteId: invite.id });

  const eula = await getCurrentEula();
  await acceptCurrentEula(user.id);
  logEvent("EULA_ACCEPTED", { userId: user.id, eulaVersion: eula.version, atSignup: true });

  return NextResponse.json({
    username: user.username,
    needsConfirmation: signUpResult.needsConfirmation,
  }, { status: 201 });
}
