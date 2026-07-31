import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { getProfilePictureUrl } from "@/lib/s3";

// Two distinct sources, both name-matched and returned together:
//  - "user": a registered account with that name — shown with their real
//    profile picture. Doesn't imply the crew member IS that account; it's
//    just a name match, since crew names are freeform text, not a relation.
//  - "colleague": a name this referee has typed into a crew field before,
//    regardless of whether it corresponds to any registered account.
// Both remain selectable side by side — e.g. a same-named colleague who
// isn't that account should still be pickable as plain text.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json([]);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);

  const prisma = await getPrisma();
  const nameMatch = [
    { firstName: { contains: q, mode: "insensitive" as const } },
    { lastName:  { contains: q, mode: "insensitive" as const } },
  ];

  const [colleagues, users] = await Promise.all([
    prisma.colleague.findMany({
      where: { userId, OR: nameMatch },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 6,
    }),
    prisma.user.findMany({
      where: { OR: nameMatch },
      select: { id: true, firstName: true, lastName: true, profilePictureKey: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 4,
    }),
  ]);

  const userSuggestions = await Promise.all(
    users.map(async (u) => ({
      kind: "user" as const,
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      profilePictureUrl: u.profilePictureKey ? await getProfilePictureUrl(u.profilePictureKey) : null,
    })),
  );

  const colleagueSuggestions = colleagues.map((c) => ({
    kind: "colleague" as const,
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
  }));

  return NextResponse.json([...userSuggestions, ...colleagueSuggestions]);
}
