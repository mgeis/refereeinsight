import { redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { getCurrentEula } from "@/lib/eula";
import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function EulaPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  const eula = await getCurrentEula();
  const prisma = await getPrisma();
  const acceptance = await prisma.eulaAcceptance.findUnique({
    where: { userId_eulaId: { userId, eulaId: eula.id } },
  });

  return (
    <div className="p-6 lg:p-10" style={{ maxWidth: "720px", backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,80,180,0.08) 0%, transparent 60%)" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ color: "#e8f4ff", fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
          End User License Agreement
        </h1>
        <p style={{ color: "rgba(120,170,220,0.6)", fontSize: "13px" }}>
          The agreement governing your use of Referee Insight.
        </p>
      </div>

      <div style={{
        display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px",
      }}>
        <div style={{
          background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)",
          borderRadius: "10px", padding: "14px 18px", flex: "1 1 200px",
        }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(100,150,200,0.6)", marginBottom: "4px" }}>
            CURRENT VERSION
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#00d2ff" }}>
            Version {eula.version}
          </div>
        </div>

        <div style={{
          background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)",
          borderRadius: "10px", padding: "14px 18px", flex: "1 1 200px",
        }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "rgba(100,150,200,0.6)", marginBottom: "4px" }}>
            YOU ACCEPTED THIS VERSION
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: acceptance ? "#60d890" : "#ff8080" }}>
            {acceptance ? formatDateTime(acceptance.acceptedAt) : "Not yet accepted"}
          </div>
        </div>
      </div>

      <div style={{
        background: "rgba(0,20,50,0.6)", border: "1px solid rgba(0,150,255,0.14)",
        borderRadius: "12px", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(0,100,200,0.12)" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(0,180,255,0.6)", fontWeight: 600 }}>
            AGREEMENT TEXT
          </div>
        </div>
        <div style={{
          padding: "20px 24px",
          fontSize: "13px",
          lineHeight: "1.7",
          color: "rgba(200,225,255,0.85)",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
        }}>
          {eula.content.trim()}
        </div>
      </div>
    </div>
  );
}
