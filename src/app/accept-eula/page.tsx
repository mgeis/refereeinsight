import { redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { hasAcceptedCurrentEula } from "@/lib/eula";
import { EulaViewer } from "@/components/EulaViewer";
import { AcceptEulaForm } from "@/components/AcceptEulaForm";

export const dynamic = "force-dynamic";

export default async function AcceptEulaPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  // Already up to date — nothing to do here, don't let this page dead-end them.
  if (await hasAcceptedCurrentEula(userId)) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-8 py-16" style={{ background: "#050d1a" }}>
      <div className="w-full max-w-xl">
        <h1 style={{ color: "#e8f4ff", fontSize: "24px", fontWeight: 700, marginBottom: "6px" }}>
          Updated License Agreement
        </h1>
        <p style={{ color: "rgba(140,180,220,0.7)", fontSize: "14px", marginBottom: "24px" }}>
          Please review and agree to continue using Referee Insight.
        </p>

        <div style={{ marginBottom: "20px" }}>
          <EulaViewer />
        </div>

        <AcceptEulaForm />
      </div>
    </main>
  );
}
