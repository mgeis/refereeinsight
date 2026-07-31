import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { userHasRole } from "@/lib/roles";
import { getProfilePictureUrl } from "@/lib/s3";

const ROLE_NAMES = ["REFEREE", "ADMINISTRATOR", "ASSIGNOR", "MENTOR", "TEAM_STAFF"] as const;

function str(v: string | null): object | undefined {
  if (!v) return undefined;
  return { contains: v, mode: "insensitive" as const };
}

function buildOrderBy(sortByParam: string | null, sortDir: "asc" | "desc") {
  switch (sortByParam) {
    case "name":     return [{ lastName: sortDir }, { firstName: sortDir }];
    case "username": return [{ username: sortDir }];
    default:         return [{ lastName: "asc" as const }, { firstName: "asc" as const }];
  }
}

// GET /api/admin/users — every registered user, ADMINISTRATOR only.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const isAdmin = await userHasRole(userId, "ADMINISTRATOR");
  if (!isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const page  = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)));
  const skip  = (page - 1) * limit;

  const nameParam = sp.get("name");
  const roleParam = sp.get("role");
  // RoleName is an enum column, not text, so substring matching happens
  // against the fixed set of role names in JS rather than a Prisma `contains`.
  const matchingRoles = roleParam
    ? ROLE_NAMES.filter(name => name.toLowerCase().includes(roleParam.toLowerCase()))
    : null;
  const where = {
    ...(nameParam ? {
      OR: [
        { firstName: { contains: nameParam, mode: "insensitive" as const } },
        { lastName:  { contains: nameParam, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(sp.get("username") ? { username: str(sp.get("username")) } : {}),
    ...(matchingRoles ? { roles: { some: { name: { in: matchingRoles } } } } : {}),
  };

  const sortDir: "asc" | "desc" = sp.get("sortDir") === "desc" ? "desc" : "asc";
  const orderBy = buildOrderBy(sp.get("sortBy"), sortDir);

  const prisma = await getPrisma();
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, username: true, profilePictureKey: true,
        roles: { select: { name: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const results = await Promise.all(users.map(async (u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.username,
    roles: u.roles.map(r => r.name),
    profilePictureUrl: u.profilePictureKey ? await getProfilePictureUrl(u.profilePictureKey) : null,
  })));

  return NextResponse.json({ users: results, total, page, limit, pages: Math.ceil(total / limit) });
}
