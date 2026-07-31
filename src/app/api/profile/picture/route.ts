import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import {
  ALLOWED_PROFILE_PICTURE_TYPES,
  deleteProfilePicture,
  uploadProfilePicture,
} from "@/lib/s3";
import { moderateImage } from "@/lib/moderation";
import { logEvent } from "@/lib/events";

const MAX_BYTES = 5 * 1024 * 1024;

// POST /api/profile/picture  multipart/form-data, field "file"
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  if (!ALLOWED_PROFILE_PICTURE_TYPES.includes(file.type)) {
    logEvent("PROFILE_PICTURE_UPLOAD_REJECTED", { userId, reason: "unsupported_type", contentType: file.type });
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: ${ALLOWED_PROFILE_PICTURE_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    logEvent("PROFILE_PICTURE_UPLOAD_REJECTED", { userId, reason: "too_large", size: file.size });
    return NextResponse.json({ error: "File must be 5MB or smaller." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const moderation = await moderateImage(bytes);
  if (moderation.flagged) {
    logEvent("PROFILE_PICTURE_UPLOAD_REJECTED", { userId, reason: "moderation_flagged", labels: moderation.labels });
    return NextResponse.json(
      { error: "This image can't be used as a profile picture." },
      { status: 400 },
    );
  }

  const prisma = await getPrisma();

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePictureKey: true },
  });

  const key = await uploadProfilePicture(userId, bytes, file.type);

  await prisma.user.update({
    where: { id: userId },
    data: { profilePictureKey: key },
  });

  if (existing?.profilePictureKey) {
    await deleteProfilePicture(existing.profilePictureKey).catch((err) => {
      console.error("[profile/picture] failed to delete old picture:", err);
    });
  }

  logEvent("PROFILE_PICTURE_UPDATED", { userId });

  return NextResponse.json({ ok: true });
}

// DELETE /api/profile/picture
export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const prisma = await getPrisma();
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePictureKey: true },
  });

  if (!existing?.profilePictureKey) {
    return NextResponse.json({ ok: true });
  }

  await deleteProfilePicture(existing.profilePictureKey).catch((err) => {
    console.error("[profile/picture] failed to delete picture:", err);
  });

  await prisma.user.update({
    where: { id: userId },
    data: { profilePictureKey: null },
  });

  logEvent("PROFILE_PICTURE_REMOVED", { userId });

  return NextResponse.json({ ok: true });
}
