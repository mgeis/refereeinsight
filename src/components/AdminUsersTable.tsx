"use client";

import { MatchReportsTable, ReportColumn, BaseReport } from "@/components/MatchReportsTable";
import { Avatar } from "@/components/Avatar";

type User = BaseReport & {
  firstName: string;
  lastName: string;
  username: string;
  roles: string[];
  profilePictureUrl: string | null;
};

const COLUMNS: ReportColumn<User>[] = [
  {
    key: "photo", label: "Photo",
    render: u => <Avatar url={u.profilePictureUrl} firstName={u.firstName} lastName={u.lastName} size={28} />,
  },
  {
    key: "name", label: "Name", filterParam: "name",
    render: u => `${u.firstName} ${u.lastName}`,
  },
  {
    key: "username", label: "Username", filterParam: "username",
    cellStyle: { color: "rgba(160,195,235,0.7)" },
    render: u => u.username,
  },
  {
    key: "roles", label: "Roles", filterParam: "role",
    render: u => u.roles.length === 0 ? (
      <span style={{ color: "rgba(100,150,200,0.4)", fontStyle: "italic" }}>None</span>
    ) : (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {u.roles.map(r => (
          <span key={r} style={{
            fontSize: "10px", padding: "2px 7px", borderRadius: "4px",
            background: "rgba(0,100,200,0.15)", border: "1px solid rgba(0,150,255,0.25)",
            color: "rgba(140,190,230,0.9)", whiteSpace: "nowrap",
          }}>
            {r}
          </span>
        ))}
      </div>
    ),
  },
];

export function AdminUsersTable() {
  return (
    <MatchReportsTable<User>
      apiUrl="/api/admin/users"
      dataKey="users"
      columns={COLUMNS}
      title="Users"
      emptyLabel="No users yet."
      subtitle={total => total > 0 ? `${total} user${total !== 1 ? "s" : ""}` : "No users yet"}
    />
  );
}
