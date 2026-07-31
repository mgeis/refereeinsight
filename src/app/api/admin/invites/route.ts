import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { userHasRole } from "@/lib/roles";
import { generateInviteCode, hashInviteCode } from "@/lib/inviteCodes";
import { sendEmail } from "@/lib/email";
import { wrapEmailHtml, codeBlock, buttonLink } from "@/lib/emailTemplate";
import { logEvent } from "@/lib/events";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v: string | null): object | undefined {
  if (!v) return undefined;
  return { contains: v, mode: "insensitive" as const };
}

// GET /api/admin/invites?page=&limit=&email= — ADMINISTRATOR only.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const page  = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const skip  = (page - 1) * limit;

  const where = {
    ...(sp.get("email") ? { email: str(sp.get("email")) } : {}),
  };

  const prisma = await getPrisma();
  const [invites, total] = await Promise.all([
    prisma.invite.findMany({
      where,
      include: { invitedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.invite.count({ where }),
  ]);

  const now = new Date();
  const results = invites.map(i => ({
    id: i.id,
    email: i.email,
    createdAt: i.createdAt,
    expiresAt: i.expiresAt,
    consumedAt: i.consumedAt,
    invitedBy: i.invitedBy,
    status: i.consumedAt ? "used" : i.expiresAt < now ? "expired" : "pending",
  }));

  return NextResponse.json({ invites: results, total, page, limit, pages: Math.ceil(total / limit) });
}

// POST /api/admin/invites  body: { email } — ADMINISTRATOR only.
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { email } = await req.json().catch(() => ({ email: undefined }));
  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const prisma = await getPrisma();
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await prisma.invite.create({
    data: { email: trimmedEmail, codeHash: hashInviteCode(code), invitedById: userId, expiresAt },
  });

  const signupUrl = new URL("/signup", req.nextUrl.origin);
  signupUrl.searchParams.set("invite", code);
  signupUrl.searchParams.set("email", trimmedEmail);

  const html = wrapEmailHtml(`
    <p style="margin:0 0 8px 0;font-size:16px;color:#e8f4ff;font-weight:600;">You're invited to Referee Insight</p>
    <p style="margin:0 0 4px 0;">Use the code below to create your account — it's valid for one week and can only be used with this email address.</p>
    ${codeBlock(code)}
    <p style="margin:0;color:rgba(180,210,240,0.6);font-size:12px;">Don't share this code — it's tied to ${trimmedEmail} and can only be used once.</p>
    ${buttonLink(signupUrl.toString(), "Create your account")}
  `);

  try {
    await sendEmail({ to: trimmedEmail, subject: "You're invited to Referee Insight", html });
  } catch (err) {
    await prisma.invite.delete({ where: { id: invite.id } });
    console.error("[admin/invites] failed to send invite email:", err);
    return NextResponse.json({ error: "Failed to send the invite email. The invite was not created." }, { status: 502 });
  }

  logEvent("INVITE_SENT", { userId, inviteId: invite.id, email: trimmedEmail });

  return NextResponse.json({ id: invite.id, email: invite.email, expiresAt: invite.expiresAt }, { status: 201 });
}
