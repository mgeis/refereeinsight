import { Fragment } from "react";
import { redirect } from "next/navigation";
import { getSessionUserIdFromCookies } from "@/lib/session";
import { DocPage, DocSection, DocP, DocSteps, DocNote } from "@/components/HelpDoc";

export default async function CreatingAMatchReportHelpPage() {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) redirect("/");

  return (
    <DocPage
      title="Creating a Match Report"
      subtitle="How to record a match you officiated, from basic details through cautions and send-offs."
    >
      <DocSection title="1. Start a new report">
        <DocP>
          From the sidebar, open <strong>Referee → Add Match Report</strong>, or click
          <strong> + ADD REPORT</strong> from the Match Reports list.
        </DocP>
      </DocSection>

      <DocSection title="2. New match or existing match?">
        <DocP>
          A match is a shared record — if another member of your crew already logged it, you can
          attach your report to their match instead of re-entering the same details. Choose one of
          the two buttons at the top of the form:
        </DocP>
        <DocSteps
          items={[
            <Fragment key="new"><strong>New Match</strong> — nobody has logged this match yet. You&apos;ll enter the full match details yourself.</Fragment>,
            <Fragment key="existing"><strong>Existing Match</strong> — search by team name or location to find a match a crew member already created, then attach your report to it.</Fragment>,
          ]}
        />
      </DocSection>

      <DocSection title="3a. New Match details">
        <DocSteps
          items={[
            <Fragment key="date">Enter the <strong>Match Date</strong> and <strong>Kick-off Time</strong>.</Fragment>,
            <Fragment key="location">Enter the <strong>Location / Venue</strong>.</Fragment>,
            <Fragment key="teams">Enter <strong>Home Team</strong> and <strong>Away Team</strong>.</Fragment>,
            <Fragment key="league">Enter the <strong>League / Competition</strong> and select an <strong>Age Group</strong>.</Fragment>,
            <Fragment key="position">Select <strong>Your Position</strong> — Referee, Assistant Referee 1/2, or 4th Official. The rest of the form (crew, feedback) only appears once a position is selected.</Fragment>,
          ]}
        />
      </DocSection>

      <DocSection title="3b. Existing Match search">
        <DocSteps
          items={[
            <Fragment key="search">Type part of a team name or the venue into the search box. Matching results appear below as you type.</Fragment>,
            <Fragment key="results">Results show who has already reported which position on that match, so you can confirm it&apos;s the right game before attaching.</Fragment>,
            <Fragment key="select">Click a result to select it, then choose <strong>Your Position</strong>. Positions already claimed by another report aren&apos;t offered — each position can only be reported once per match.</Fragment>,
          ]}
        />
        <DocNote>
          In this mode, match details and crew names come from the match record and are shown
          read-only — you&apos;re not re-entering them.
        </DocNote>
      </DocSection>

      <DocSection title="4. Officiating crew">
        <DocP>
          In <strong>New Match</strong> mode, enter each crew member&apos;s name for every position
          other than your own, or check <strong> N/A</strong>{" "}if that position wasn&apos;t filled.
          The Referee position can&apos;t be marked N/A — every match needs a center referee on
          record. In <strong>Existing Match</strong> mode, crew names are already set on the match
          and shown for reference only.
        </DocP>
        <DocNote>
          Names you enter here are remembered as <strong>Colleagues</strong>{" "}on your account, so
          they&apos;ll autocomplete the next time you type the same name on a future report.
        </DocNote>
      </DocSection>

      <DocSection title="5. Crew feedback">
        <DocP>
          For each named crew member, you can record feedback they gave you and feedback
          you have for them. Both are optional — leave blank for anyone you have nothing to note.
        </DocP>
      </DocSection>

      <DocSection title="6. Reflection">
        <DocP>
          Fill in up to three <strong>Things That Went Well</strong> and three <strong>Areas to
          Improve</strong>, plus an optional free-form personal reflection. These are for your own
          development tracking — the AI Insights tool can later look back across reports and help
          you spot patterns here.
        </DocP>
      </DocSection>

      <DocSection title="7. Cautions and send-offs">
        <DocP>
          Cautions and send-offs belong to the match, not to any one report, so only the report
          filed as <strong>Referee</strong>{" "}can add them — assistant referees and the 4th
          official will see a note instead of these controls.
        </DocP>
        <DocSteps
          items={[
            <Fragment key="open">Click <strong>+ CAUTION</strong> or <strong>+ SEND-OFF</strong> to open the misconduct form.</Fragment>,
            <Fragment key="fill">Fill in the minute, who it was issued to (player or team staff), their name/number, and the reason.</Fragment>,
            <Fragment key="repeat">Repeat for each card issued during the match. Added cards appear in a list below the buttons — click the × on any row to remove it before saving.</Fragment>,
          ]}
        />
      </DocSection>

      <DocSection title="8. Save">
        <DocP>
          Click <strong>SAVE REPORT</strong>{" "}at the bottom of the form. You&apos;ll be redirected to
          your Match Reports list, where the new report appears immediately.
        </DocP>
        <DocNote>
          Only you can see or edit reports you create — see the Match Reports list for filtering
          and sorting once you have more than a few on record.
        </DocNote>
      </DocSection>
    </DocPage>
  );
}
