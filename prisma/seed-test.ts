import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const d = (s: string) => new Date(s);
const t = (s: string) => new Date(`1970-01-01T${s}Z`);

type MisconductInput = {
  type: "CAUTION" | "SENDOFF";
  recipientType: "PLAYER" | "TEAM_STAFF";
  minute: number;
  number?: string | null;
  name: string;
  reason: string;
  description?: string | null;
};

type ReportInput = {
  matchDate: Date; matchTime: Date; location: string;
  homeTeam: string; awayTeam: string; league: string; ageGroup: string;
  positionId: number;
  refereeCrewName?: string | null; ar1CrewName?: string | null;
  ar2CrewName?: string | null; fourthCrewName?: string | null;
  feedbackFromReferee?: string | null; feedbackFromAr1?: string | null;
  feedbackFromAr2?: string | null; feedbackFromFourth?: string | null;
  feedbackForReferee?: string | null; feedbackForAr1?: string | null;
  feedbackForAr2?: string | null; feedbackForFourth?: string | null;
  personalReflection?: string | null;
  wentWell1?: string | null; wentWell2?: string | null; wentWell3?: string | null;
  toImprove1?: string | null; toImprove2?: string | null; toImprove3?: string | null;
  misconducts: MisconductInput[];
};

async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { username: "referee" } });

  // Upsert colleagues
  const newColleagues = [
    { firstName: "Steve",  lastName: "May"     },
    { firstName: "Steven", lastName: "Gans"    },
    { firstName: "Rich",   lastName: "Fern"    },
    { firstName: "Pedro",  lastName: "Luna"    },
    { firstName: "Turan",  lastName: "Ozdemir" },
    { firstName: "Joe",    lastName: "May"     },
    { firstName: "Bruno",  lastName: "Silva"   },
  ];
  for (const c of newColleagues) {
    const exists = await prisma.colleague.findFirst({
      where: { userId: user.id, firstName: { equals: c.firstName, mode: "insensitive" }, lastName: { equals: c.lastName, mode: "insensitive" } },
    });
    if (!exists) {
      await prisma.colleague.create({ data: { ...c, userId: user.id } });
      console.log(`  + colleague: ${c.firstName} ${c.lastName}`);
    }
  }

  const positions = await prisma.position.findMany({ orderBy: { id: "asc" } });
  const pos: Record<string, number> = {};
  for (const p of positions) pos[p.name] = p.id;
  const REF   = pos["Referee"];
  const AR1   = pos["Assistant Referee 1"];
  const AR2   = pos["Assistant Referee 2"];
  const FOUR  = pos["4th Official"];

  const reports: ReportInput[] = [

    // ─── MATCHES 1-5: User = Referee ───────────────────────────────────────────

    {
      matchDate: d("2026-01-11"), matchTime: t("10:00:00"),
      location: "Riverside Sports Complex Field 2",
      homeTeam: "FC United", awayTeam: "Riverside FC",
      league: "AYSO Region 10", ageGroup: "U14", positionId: REF,
      refereeCrewName: null, ar1CrewName: "Steve May", ar2CrewName: "Rich Fern", fourthCrewName: "N/A",
      feedbackFromAr1: "Clean game management. Your positioning in the second half was excellent. One suggestion — tighten up your relationship with the top of the box on crosses.",
      feedbackFromAr2: "Good control throughout. Your communication on set pieces was helpful. One signal in the 41st that confused me, but overall a solid game.",
      feedbackForAr1: "Steve had excellent flag mechanics and clear signals all game. Positioning was strong for most of the match. Needs to hold the line more firmly on late diagonal runs from midfield.",
      feedbackForAr2: "Rich was accurate on the offside line throughout. Should communicate more verbally with me during heated moments near the technical area.",
      personalReflection: "Solid game overall. The U14 match had some physicality I didn't anticipate. Managed to de-escalate a heated moment in the second half without cards, which felt like the right call. Need to be more consistent about getting to the second post during corner kicks.",
      wentWell1: "Managed player dissent effectively without needing cards",
      wentWell2: "Clear and consistent foul recognition in the midfield third",
      wentWell3: "Pre-game briefing set clear expectations and crew was on the same page all match",
      toImprove1: "Positioning after goal kicks — was caught too far upfield twice",
      toImprove2: "Corner kick coverage — need to get tighter to the second post",
      toImprove3: "Should have given an earlier verbal warning to #7 before the second-half escalation",
      misconducts: [],
    },

    {
      matchDate: d("2026-02-08"), matchTime: t("14:00:00"),
      location: "Memorial Park Field 1",
      homeTeam: "Westside Thunder", awayTeam: "North Stars FC",
      league: "AYSO Region 10", ageGroup: "U16", positionId: REF,
      refereeCrewName: null, ar1CrewName: "Bruno Silva", ar2CrewName: "Pedro Luna", fourthCrewName: "N/A",
      feedbackFromAr1: "Solid game. Your advantage law application was well-timed and the players responded positively. Second-half corner kick positioning could be a bit closer to play.",
      feedbackFromAr2: "Good whistling on the dangerous challenge in the 53rd. Your card management kept the game controlled when it could have spiraled.",
      feedbackForAr1: "Bruno showed good awareness of off-ball fouls near the sideline. His flag on the challenge at the 72nd minute was a beat late but he recovered his composure. Reliable overall.",
      feedbackForAr2: "Pedro was consistent on the line. His communication during the rough patch in the second half helped me stay informed. Good partner.",
      personalReflection: "A good U16 match with some quality soccer. My card management kept a physical second half under control. Need to work on my movement to stay closer to the game when it compresses into the final third.",
      wentWell1: "Advantage law — well timed on three occasions, two led directly to attacks",
      wentWell2: "Kept the game flowing; yellow card threshold was appropriate for the age and level",
      wentWell3: "Good partnership with ARs — felt confident in their calls throughout",
      toImprove1: "Movement into the final third when play compresses — was watching from too far back twice",
      toImprove2: "Communication with the coach who was getting vocal — should have addressed it earlier",
      toImprove3: "Second-half corner kick positioning needs tightening up",
      misconducts: [],
    },

    {
      matchDate: d("2026-02-22"), matchTime: t("16:00:00"),
      location: "Eastgate Soccer Complex Field A",
      homeTeam: "Harbor Lights SC", awayTeam: "Valley Athletic FC",
      league: "USSF Amateur League", ageGroup: "Adult / Open", positionId: REF,
      refereeCrewName: null, ar1CrewName: "Steven Gans", ar2CrewName: "Turan Ozdemir", fourthCrewName: "Joe May",
      feedbackFromAr1: "You handled the sendoff professionally and without hesitation. The caution earlier in the match had already set the right tone. Excellent composure under pressure.",
      feedbackFromAr2: "Tough game, but you kept your composure after the incident. I really appreciated your communication with both benches when tensions were high.",
      feedbackFromFourth: "The substitution process ran smoothly all game. I felt well-utilized in managing both technical areas. Great leadership throughout.",
      feedbackForAr1: "Steven was calm and focused through the most difficult moments of the match. His flag on the goal that was rightly disallowed was decisive and correct — a brave call. Excellent crew work.",
      feedbackForAr2: "Turan held his composure well when the home team contested his offside. His communication throughout a volatile match was consistent.",
      feedbackForFourth: "Joe was professional in managing the sideline after the sendoff, which could easily have escalated. His presence in the technical area was invaluable.",
      personalReflection: "Most demanding game of the season so far. A violent conduct sendoff in the 67th minute with the score level created a difficult atmosphere. Handled the aftermath well — both benches were calm by the final whistle. The caution for unsporting behavior in the 34th helped establish early that I wouldn't tolerate cynical play.",
      wentWell1: "Sendoff was decisive and clearly communicated — no ambiguity for either team",
      wentWell2: "Managed both technical areas effectively with Joe's support after the incident",
      wentWell3: "Pre-game briefing covered physical play expectations, which proved relevant",
      toImprove1: "Should have been closer to the incident at the 67th minute rather than having to sprint to it",
      toImprove2: "Communication with the team captain after the sendoff could have been calmer and clearer",
      toImprove3: "Positioning in transition after goal kicks left me too far from second-phase play twice",
      misconducts: [
        { type: "CAUTION", recipientType: "PLAYER", minute: 34, number: "7", name: "Marcus Johnson", reason: "Unsporting behavior", description: "Pulled the goalkeeper's jersey during a corner kick. Clear and deliberate." },
        { type: "SENDOFF", recipientType: "PLAYER", minute: 67, number: "4", name: "Devon Carter", reason: "Violent conduct", description: "Elbowed an opponent off the ball while both players were away from play. Witnessed by AR1. No doubt — immediate sendoff." },
      ],
    },

    {
      matchDate: d("2026-03-15"), matchTime: t("09:00:00"),
      location: "Lincoln Park Field 3",
      homeTeam: "Oakridge Rangers", awayTeam: "Millbrook FC",
      league: "AYSO Region 10", ageGroup: "U12", positionId: REF,
      refereeCrewName: null, ar1CrewName: "Joe May", ar2CrewName: "Steve May", fourthCrewName: "N/A",
      feedbackFromAr1: "Good game for the age group. The kids played well and you let the game flow naturally. Your signaling was very clear from where I was standing.",
      feedbackFromAr2: "You handled the coach complaint in the second half really well — firm but respectful. The kids felt safe and the game was enjoyable.",
      feedbackForAr1: "Joe showed good awareness of the younger players' pace and reactions. Positioning was solid. Would benefit from being more assertive in communicating with me on goal-line situations.",
      feedbackForAr2: "Steve kept a clean line and was attentive throughout. His immediate signal on the penalty shout in the 28th was instantly reassuring.",
      personalReflection: "Fun game. U12 soccer is a good reminder of why we do this. Kept the whistle in my pocket as much as possible and let them play. The coach situation in the second half was a good practice run for managing it calmly.",
      wentWell1: "Let the game flow — minimal stoppages and kids enjoyed themselves",
      wentWell2: "Coach dissent handled calmly and effectively without escalation",
      wentWell3: "Good communication with both teams at the coin toss set a positive tone",
      toImprove1: "Goal kick positioning — need to stop ball quicker to help young players understand restarts",
      toImprove2: "Explaining decisions verbally to the players at this age group — could do more of it",
      toImprove3: null,
      misconducts: [],
    },

    {
      matchDate: d("2026-04-05"), matchTime: t("11:00:00"),
      location: "Valley Sports Complex Field B",
      homeTeam: "Academy FC", awayTeam: "Pacific United",
      league: "US Club Soccer", ageGroup: "U18", positionId: REF,
      refereeCrewName: null, ar1CrewName: "Rich Fern", ar2CrewName: "Bruno Silva", fourthCrewName: "N/A",
      feedbackFromAr1: "Both cautions were well-managed. Your communication to the players before each card helped reduce the reaction. Good table-setting in the first five minutes.",
      feedbackFromAr2: "Good presence from the start. Physical game and you handled it with confidence. The second caution recipient was already on a warning — the right call.",
      feedbackForAr1: "Rich was aggressive in getting into position early. Had one flag that came a beat late but he recovered well and stayed composed. Strong overall.",
      feedbackForAr2: "Bruno communicated well throughout. His offside decisions were accurate and flag mechanics were clean. Reliable partner.",
      personalReflection: "Physical U18 game that required active game management from the first minute. Two cautions felt appropriate and proportionate — the players knew what was coming both times. Would have liked to have been tighter in the defensive third on one challenge I flagged from too far away.",
      wentWell1: "Early table-setting — made clear expectations in the first five minutes without over-whistling",
      wentWell2: "Both cautions were well-communicated and accepted without incident by the receiving players",
      wentWell3: "Consistent foul threshold throughout — both teams were treated the same",
      toImprove1: "Distance to the challenge on the 58th minute — had to sprint to catch up",
      toImprove2: "More use of the captain during the physical spell in the 30s",
      toImprove3: "Striking the right balance between allowing physical play and protecting the players — erred slightly on the permissive side in the first half",
      misconducts: [
        { type: "CAUTION", recipientType: "PLAYER", minute: 22, number: "9", name: "Tyler Brooks", reason: "Dissent by word or action", description: "Verbally challenged the decision on a 50-50 challenge. Already been warned verbally twice." },
        { type: "CAUTION", recipientType: "PLAYER", minute: 58, number: "11", name: "Ryan Kelsey", reason: "Persistent infringement", description: "Fourth foul of the match, systematically targeting the same opponent in the midfield." },
      ],
    },

    // ─── MATCHES 6-10: User = AR1 ──────────────────────────────────────────────

    {
      matchDate: d("2026-04-19"), matchTime: t("10:00:00"),
      location: "Hillside Sports Center Field 1",
      homeTeam: "North Stars FC", awayTeam: "Dynamo Youth",
      league: "AYSO Region 10", ageGroup: "U14", positionId: AR1,
      refereeCrewName: "Steve May", ar1CrewName: null, ar2CrewName: "Pedro Luna", fourthCrewName: "N/A",
      feedbackFromReferee: "Good positioning on the touchline throughout. Your flag on the 55th-minute challenge was correctly withheld. Stay tighter to the second-to-last defender on corner kicks.",
      feedbackFromAr2: "Good communication with Steve. Your signaling on the goal kick vs. corner distinction was really clear — helped me from the far side.",
      feedbackForReferee: "Steve managed the game tempo well. His table-setting in the pregame was effective and the players responded. He could be quicker to address persistent foulers rather than waiting for them to escalate.",
      feedbackForAr2: "Pedro was consistent and reliable throughout. Had a strong flag withheld on a borderline offside that I agreed with when we discussed it at halftime. Communication was solid.",
      personalReflection: "Enjoyed this game from the AR position. I felt confident in my offside calls. One moment in the 38th where I wasn't sure if play was offside and held — it was the right decision. Good partnership with Steve and Pedro.",
      wentWell1: "Confident offside decisions throughout — held flags when uncertain and it paid off",
      wentWell2: "Clear flag signals that Steve could read easily from midfield",
      wentWell3: "Good communication with AR2 on the overall line across the field",
      toImprove1: "Positioning relative to the second-to-last defender on corner kicks — drifted back too far twice",
      toImprove2: "Goal kick vs. corner communication — one situation where I delayed the signal",
      toImprove3: "Need to trust instincts more on borderline throw-in decisions near the halfway line",
      misconducts: [],
    },

    {
      matchDate: d("2026-05-03"), matchTime: t("15:00:00"),
      location: "Oakridge Community Fields Field 2",
      homeTeam: "Riverside FC", awayTeam: "Harbor Lights SC",
      league: "AYSO Region 10", ageGroup: "U16", positionId: AR1,
      refereeCrewName: "Bruno Silva", ar1CrewName: null, ar2CrewName: "Joe May", fourthCrewName: "N/A",
      feedbackFromReferee: "Your positioning was excellent for most of the match. The flag on the 38th was well held and I trusted it completely. One area to develop: communicate earlier when you have eyes on something I might be missing.",
      feedbackFromAr2: "Good partnership. Your level was clear and consistent throughout the match when teams were using the offside trap.",
      feedbackForReferee: "Bruno ran a physically demanding match and maintained composure. His advantage application was well-timed. Could give more guidance to ARs on set piece positioning before kick-off.",
      feedbackForAr2: "Joe was solid and his communication across the field was clear. Should hold the line more firmly when wingers make late diagonal runs — he recovered twice but had to work hard to do it.",
      personalReflection: "Good U16 game with good-quality teams using the offside trap actively. I felt sharp on the line. Held my flag twice when I wasn't 100% certain and both times play came back onside. Trust the process.",
      wentWell1: "Offside line discipline — held flag correctly on two very close calls",
      wentWell2: "Throw-in decisions were clean all match — no pushback from either sideline",
      wentWell3: "Good pre-game partnership building with Bruno before kick-off",
      toImprove1: "Earlier verbal communication to the center when I spot off-ball issues",
      toImprove2: "Positioning on free kicks near the top of the penalty area — was slightly behind play",
      toImprove3: "Should track the ball speed coming from goal kicks to adjust position faster",
      misconducts: [],
    },

    {
      matchDate: d("2026-05-17"), matchTime: t("13:00:00"),
      location: "Memorial Park Field 3",
      homeTeam: "Lincoln Park FC", awayTeam: "Westside Thunder",
      league: "Adult Recreation League", ageGroup: "Adult / Open", positionId: AR1,
      refereeCrewName: "Rich Fern", ar1CrewName: null, ar2CrewName: "Turan Ozdemir", fourthCrewName: "N/A",
      feedbackFromReferee: "Strong game. Your awareness on the back post during corners was excellent — you were in exactly the right position twice. Keep working on communicating throw-ins when there's any doubt near the dugout side.",
      feedbackFromAr2: "Great to work with you. Your energy on the touchline and communication were a real help in a physical adult match.",
      feedbackForReferee: "Rich was solid and decisive throughout a physical adult game. His card management kept the match under control. Should trust his ARs more on the offside decisions rather than hesitating.",
      feedbackForAr2: "Turan was attentive and accurate on the offside line. His positioning to simultaneously watch play and the line was good. One late flag in the second half, but he made the correct decision.",
      personalReflection: "Physical adult game. Needed to be mentally sharp throughout. Felt comfortable with the throw-in decisions which is an area I've been working on. Corner kick positioning was one of my best performances.",
      wentWell1: "Back-post positioning on corner kicks was precise and proactive",
      wentWell2: "Throw-in decisions were confident and consistent under pressure",
      wentWell3: "Good communication with Rich throughout a fast-paced match",
      toImprove1: "Should be quicker to communicate to the center when I sense a confrontation developing",
      toImprove2: "Staying in line when the game transitions quickly from attack to defense",
      toImprove3: "Positioning on direct free kicks taken from near the touchline — need to get closer",
      misconducts: [],
    },

    {
      matchDate: d("2026-06-01"), matchTime: t("16:00:00"),
      location: "Eastgate Soccer Complex Field B",
      homeTeam: "Pacific United", awayTeam: "Academy FC",
      league: "US Club Soccer", ageGroup: "U19", positionId: AR1,
      refereeCrewName: "Steven Gans", ar1CrewName: null, ar2CrewName: "Steve May", fourthCrewName: "Pedro Luna",
      feedbackFromReferee: "Your flag on the DOGSO denial was perfectly timed and gave me all the information I needed to make a clear decision. Excellent work under enormous pressure — that call changed the game.",
      feedbackFromAr2: "Good positioning throughout a difficult match. You were calm and decisive after the heated challenge — it settled me down too.",
      feedbackFromFourth: "Good communication between us across the field. Your awareness of the technical area situation was appreciated during the sendoff process.",
      feedbackForReferee: "Steven handled the sendoff and all its aftermath with authority and professionalism. His game management throughout a charged, high-quality match was excellent. One of the best referees I've worked with.",
      feedbackForAr2: "Steve was composed and accurate throughout. His positioning during the build-up phase was excellent — gave me confidence in my own line.",
      feedbackForFourth: "Pedro managed the 4th official role well, particularly keeping the technical areas calm during and after the sendoff. His board signals were timed correctly all match.",
      personalReflection: "Most significant game I've been involved in this season. A DOGSO sendoff at the 78th minute — my flag was the key piece of information for Steven's decision. I had clear sightlines and I had no doubt. The crew was excellent and we managed the aftermath professionally.",
      wentWell1: "DOGSO flag was decisive, correctly timed, and held under pressure",
      wentWell2: "Stayed composed and in position throughout a difficult period following the sendoff",
      wentWell3: "Excellent crew communication from start to finish — felt like a team",
      toImprove1: "Pre-match positioning plan for attacks from left channel — was caught slightly behind once",
      toImprove2: "Signaling on the out-of-bounds decisions near the corner flag — one was too slow",
      toImprove3: "Managing my own adrenaline after a big call — took a few minutes to fully reset",
      misconducts: [
        { type: "CAUTION", recipientType: "PLAYER", minute: 31, number: "3", name: "Marco Reyes", reason: "Unsporting behavior", description: "Deliberately handled a clearance to stop a counterattack. Deliberate handling by a player not in a DOGSO position." },
        { type: "SENDOFF", recipientType: "PLAYER", minute: 78, number: "10", name: "Jake Morrison", reason: "Denying a goal or obvious goal-scoring opportunity – foul", description: "Last defender pulled down the striker in behind inside the penalty area. DOGSO — penalty and red. AR1 flag confirmed. Clear and obvious." },
      ],
    },

    {
      matchDate: d("2026-06-14"), matchTime: t("09:30:00"),
      location: "Lincoln Park Field 1",
      homeTeam: "Dynamo Youth", awayTeam: "Oakridge Rangers",
      league: "AYSO Region 10", ageGroup: "U12", positionId: AR1,
      refereeCrewName: "Turan Ozdemir", ar1CrewName: null, ar2CrewName: "Bruno Silva", fourthCrewName: "N/A",
      feedbackFromReferee: "Very reliable throughout. Your throw-in decisions were all accurate. Work on positioning slightly ahead of the second-to-last defender during counterattacks — you were caught behind once.",
      feedbackFromAr2: "Good energy on the touchline — it helped me stay focused. Clear communication throughout.",
      feedbackForReferee: "Turan refereed a clean, enjoyable U12 game with good confidence. Decisive on dangerous play. Occasionally positioned too far from play when the game sped up on the break.",
      feedbackForAr2: "Bruno had excellent mechanics and clean signals. His positioning to watch play and the line simultaneously was a highlight. Strong partner.",
      personalReflection: "Fun U12 game to finish the week. Simple, clean, well-organized. Good practice for the fundamentals — throw-ins, corner/goal kick calls, and keeping the line sharp even when the pace drops.",
      wentWell1: "Throw-in decisions were clean all match — zero disputes from the sidelines",
      wentWell2: "Consistent offside positioning even when the game pace was slower",
      wentWell3: "Good energy throughout a morning game",
      toImprove1: "Positioning during counterattacks — need to anticipate and move earlier",
      toImprove2: "Communication with center when I spot potential issues — spoke up once too late",
      toImprove3: null,
      misconducts: [],
    },

    // ─── MATCHES 11-15: User = AR2 ─────────────────────────────────────────────

    {
      matchDate: d("2026-03-08"), matchTime: t("11:00:00"),
      location: "Hillside Sports Center Field 2",
      homeTeam: "FC United", awayTeam: "North Stars FC",
      league: "AYSO Region 10", ageGroup: "U14", positionId: AR2,
      refereeCrewName: "Pedro Luna", ar1CrewName: "Joe May", ar2CrewName: null, fourthCrewName: "N/A",
      feedbackFromReferee: "Your line was excellent and I trusted your flags completely. Nice work on the back-post positioning during corners — you were always where I needed you to be.",
      feedbackFromAr1: "Good communication on the line. Your signal on the contentious offside in the 44th was clear and decisive — helped the whole crew stay aligned.",
      feedbackForReferee: "Pedro ran a well-organized match with good age-appropriate game management. Could communicate more actively with ARs during tactical stoppages.",
      feedbackForAr1: "Joe had clean mechanics and good awareness of pace. His positioning was strong. Needs to communicate earlier on challenges near the touchline rather than waiting to see how they develop.",
      personalReflection: "Comfortable game from the AR2 position. I was tested on a couple of close offside calls in the second half and held my flag both times. Pleased with the back-post work on corners — that's been an area of focus.",
      wentWell1: "Back-post corner kick positioning — confident and consistent",
      wentWell2: "Close offside calls — held flags correctly twice",
      wentWell3: "Good communication across to AR1 and the center throughout",
      toImprove1: "Need to move more quickly when the ball switches from my side to AR1's side",
      toImprove2: "More vocal with the center when I spot brewing tensions near the technical area",
      toImprove3: "Goal kick decision on the 61st — was slow to signal after a deflection",
      misconducts: [],
    },

    {
      matchDate: d("2026-03-22"), matchTime: t("15:30:00"),
      location: "Riverside Sports Complex Field 1",
      homeTeam: "Westside Thunder", awayTeam: "Valley Athletic FC",
      league: "Adult Recreation League", ageGroup: "Adult / Open", positionId: AR2,
      refereeCrewName: "Steve May", ar1CrewName: "Rich Fern", ar2CrewName: null, fourthCrewName: "N/A",
      feedbackFromReferee: "Your positioning throughout was excellent. During both caution sequences I appreciated your flags staying neutral and not influencing the cards — well done. Solid partner.",
      feedbackFromAr1: "Good communication across. You helped me with the tricky build-up near our technical area in the second half — I appreciated the heads-up.",
      feedbackForReferee: "Steve managed both card situations professionally and the cautions were well-calibrated. Could use more vocal communication with ARs when moving to deal with player confrontations — I wasn't sure whether to stay in position or move to assist.",
      feedbackForAr1: "Rich had a sharp game. Signals were decisive and his movement into position near the technical area was proactive. Good to work with.",
      personalReflection: "Physical adult game with two cautions. I kept my flag hand disciplined during both card sequences — Steve needed to focus and didn't need interference from me. Good test of positioning during the heated second-half period.",
      wentWell1: "Flag discipline during card sequences — neutral and non-influencing",
      wentWell2: "Offside line was tight throughout despite the physical play",
      wentWell3: "Proactive communication with AR1 about the situation near the technical area",
      toImprove1: "Need clearer protocol with the center on when ARs should move to assist vs. stay in position",
      toImprove2: "Positioning when a confrontation is developing away from me — do I drift toward it?",
      toImprove3: "One throw-in decision near the halfway line I second-guessed — should have been more confident",
      misconducts: [
        { type: "CAUTION", recipientType: "PLAYER", minute: 18, number: "5", name: "Luis Vargas", reason: "Unsporting behavior", description: "Pulled back an opponent by the shirt on a clear breakaway. Deliberate. Correct caution." },
        { type: "CAUTION", recipientType: "TEAM_STAFF", minute: 72, number: null, name: "Coach Mike Torres", reason: "Dissent by word or action", description: "Continuously argued decisions from the technical area after multiple verbal warnings from the 4th official." },
      ],
    },

    {
      matchDate: d("2026-04-12"), matchTime: t("10:30:00"),
      location: "Valley Sports Complex Field A",
      homeTeam: "Harbor Lights SC", awayTeam: "Millbrook FC",
      league: "AYSO Region 10", ageGroup: "U16", positionId: AR2,
      refereeCrewName: "Bruno Silva", ar1CrewName: "Steven Gans", ar2CrewName: null, fourthCrewName: "N/A",
      feedbackFromReferee: "Very clean line throughout. Your flag on the goal — correctly allowing it, not offside — was a brave call with the home crowd reacting. Excellent.",
      feedbackFromAr1: "Good communication on the line from your side. The synchronization during the offside trap sequences was excellent.",
      feedbackForReferee: "Bruno had excellent game flow and his positioning and decisiveness were both strong. One slightly slow call on a challenge in the 71st but overall excellent work.",
      feedbackForAr1: "Steven was a reliable partner throughout. His signals were clear and decisive and his communication with Bruno was effective. Good to share the field with him.",
      personalReflection: "The brave offside flag that allowed the goal was the highlight. I had a perfect sightline, I was in the right position, and I was certain. No hesitation. That's the standard.",
      wentWell1: "Decisive flag on the allowed goal — held correctly and with full confidence",
      wentWell2: "Synchronization with AR1 on the offside trap was tight throughout",
      wentWell3: "Back-post corner work — consistently in position",
      toImprove1: "Need to communicate the 'flag held' decision to the center quicker after the moment passes",
      toImprove2: "Anticipating the press — sometimes trailing the attackers slightly on fast transitions",
      toImprove3: "One moment where I drifted out of the line during a goal kick — need to reset faster",
      misconducts: [],
    },

    {
      matchDate: d("2026-04-26"), matchTime: t("13:00:00"),
      location: "Millbrook Recreation Fields Field 2",
      homeTeam: "Pacific United", awayTeam: "Dynamo Youth",
      league: "US Club Soccer", ageGroup: "U18", positionId: AR2,
      refereeCrewName: "Joe May", ar1CrewName: "Turan Ozdemir", ar2CrewName: null, fourthCrewName: "N/A",
      feedbackFromReferee: "Good game. Clean calls on the line. You were quick to get your flag up on the offside in the 88th — that saved us from a very contentious situation.",
      feedbackFromAr1: "Good energy throughout. Your communication was clear, especially in the second half when the game was stretched.",
      feedbackForReferee: "Joe managed a difficult U18 match with good composure. His handling of the controversial challenge late in the game was commendable — he let it develop before making the decision.",
      feedbackForAr1: "Turan was solid throughout. His positioning for the high balls coming in from my side was strong. One signal could have come a second earlier but overall a very reliable performance.",
      personalReflection: "Busy second half with plenty of activity on my side. The offside in the 88th was the key moment — I was exactly in the right position and had no doubt. Late-game concentration is something I've been working on and this was a good test.",
      wentWell1: "Late-game concentration — offside in the 88th was sharp and decisive",
      wentWell2: "Positioning for crosses from the right channel was consistently good",
      wentWell3: "Communication with Joe on fast transitions throughout the second half",
      toImprove1: "First-half positioning drifted slightly — need to be more disciplined from the first minute",
      toImprove2: "Goal-line decisions during corners — was in the right position but need to communicate it to Joe faster",
      toImprove3: "One throw-in I signaled incorrectly near the corner flag — hesitated too long",
      misconducts: [],
    },

    {
      matchDate: d("2026-05-10"), matchTime: t("15:00:00"),
      location: "Harbor View Sports Park Field A",
      homeTeam: "Lincoln Park FC", awayTeam: "Eastgate SC",
      league: "USSF Amateur League", ageGroup: "Adult / Open", positionId: AR2,
      refereeCrewName: "Rich Fern", ar1CrewName: "Pedro Luna", ar2CrewName: null, fourthCrewName: "Bruno Silva",
      feedbackFromReferee: "Your line management was excellent all game. The tough withheld flag at the 76th minute — where you stayed put and play resumed — was exactly the right call.",
      feedbackFromAr1: "Great teamwork across the field. Your energy helped me stay sharp in the second half during a long game.",
      feedbackFromFourth: "Good communication across to me from your side of the field. You kept me informed on the touchline situations near your technical area.",
      feedbackForReferee: "Rich had a strong match. His card management in a physical adult game was well-calibrated and both teams respected his authority. Should delegate more to his ARs on borderline decisions.",
      feedbackForAr1: "Pedro was consistent and accurate throughout. His communication during a heated build-up moment in the 60s was proactive and helpful. Good partner.",
      feedbackForFourth: "Bruno managed the 4th official role professionally. His timing on substitution boards was accurate and he maintained control of the technical areas.",
      personalReflection: "Tough adult match that went the full distance. The 76th-minute withheld flag was the defining decision — I had the angle, I was certain it wasn't offside, and I held. Rich trusted me completely. That's the crew relationship we worked to build.",
      wentWell1: "76th-minute flag withheld — correct call under real pressure with crowd reaction",
      wentWell2: "Positioning discipline for the full 90+ minutes in a long adult match",
      wentWell3: "Communication with Rich and Bruno throughout was excellent",
      toImprove1: "Should be quicker to signal out of bounds on the far touchline when I have clear sight",
      toImprove2: "Closer engagement with AR1 at halftime to align on any line positioning issues",
      toImprove3: "One corner kick vs. goal kick confusion near the byline — need to get lower to see the deflection better",
      misconducts: [],
    },

    // ─── MATCHES 16-20: User = 4th Official ────────────────────────────────────

    {
      matchDate: d("2026-01-25"), matchTime: t("14:00:00"),
      location: "Eastgate Soccer Complex Field C",
      homeTeam: "Valley Athletic FC", awayTeam: "Academy FC",
      league: "USSF Amateur League", ageGroup: "Adult / Open", positionId: FOUR,
      refereeCrewName: "Steven Gans", ar1CrewName: "Turan Ozdemir", ar2CrewName: "Pedro Luna", fourthCrewName: null,
      feedbackFromReferee: "Your board management was excellent throughout. Clear signals, accurate timing on substitutions, and you kept both technical areas under control without needing me to step in.",
      feedbackFromAr1: "Good energy in the technical area. You kept the coaches in check effectively — there was a potential situation with the assistant coach in the 60s that you defused before I even saw it.",
      feedbackFromAr2: "Helpful communication throughout the game. Good to have a reliable 4th keeping the match organized.",
      feedbackForReferee: "Steven commanded the game with authority. Excellent positioning and decisive on foul recognition. His game management was thorough and professional.",
      feedbackForAr1: "Turan was solid and accurate on the line. Signals were clean and well-timed throughout. Reliable partner.",
      feedbackForAr2: "Pedro maintained a solid offside line. Consistent and accurate throughout. Good communication with Steven.",
      personalReflection: "Good debut in the 4th official role at a higher level. The substitution board process became second nature quickly. Defusing the assistant coach situation in the 60s without involving Steven was a highlight — exactly what the 4th should do.",
      wentWell1: "Board management was efficient and accurate all game",
      wentWell2: "Proactively managed coach dissent without needing to involve the center",
      wentWell3: "Good communication with both Steven and the AR on my side throughout",
      toImprove1: "Faster movement to alert the center when I observe something significant",
      toImprove2: "Managing the substitution timing more precisely — one board came out a half-minute late",
      toImprove3: "Need to position myself better to see challenges near the technical area sideline",
      misconducts: [],
    },

    {
      matchDate: d("2026-02-15"), matchTime: t("16:00:00"),
      location: "Harbor View Sports Park Field B",
      homeTeam: "Eastgate SC", awayTeam: "Lincoln Park FC",
      league: "US Club Soccer", ageGroup: "U19", positionId: FOUR,
      refereeCrewName: "Steve May", ar1CrewName: "Bruno Silva", ar2CrewName: "Rich Fern", fourthCrewName: null,
      feedbackFromReferee: "Your work in managing the bench after the sendoff was exceptional. The home team could easily have escalated and you kept everyone contained and professional.",
      feedbackFromAr1: "Good communication across throughout the whole match. You gave me a heads-up on the home bench before it became a problem — really helpful.",
      feedbackFromAr2: "Appreciated your communication. Clear board signals throughout the game — never had to ask twice.",
      feedbackForReferee: "Steve managed a volatile match with confidence and authority. Both cautions were well-executed and the sendoff was decisive. Strong performance under pressure.",
      feedbackForAr1: "Bruno had an excellent game on the line. His positioning and signal clarity were outstanding — gave Steve everything he needed.",
      feedbackForAr2: "Rich maintained a clean line throughout a physically demanding match. His flag management during set pieces was reliable and consistent.",
      personalReflection: "A sendoff followed by volatile bench reactions is exactly the situation the 4th official is there for. Kept calm, communicated clearly with both sets of staff, and prevented a situation from becoming worse. Satisfied with how I handled it. The two earlier cautions helped build an accurate picture of the game's temperature.",
      wentWell1: "Bench management after the sendoff — contained the reaction professionally",
      wentWell2: "Proactive intelligence to AR1 about bench behavior before Steve needed to intervene",
      wentWell3: "Board signals were clear and accurate throughout",
      toImprove1: "Should position myself to better observe the technical area during set pieces, not just during normal play",
      toImprove2: "More explicit communication to Steve about what I was managing on the bench",
      toImprove3: "Managing my own composure when multiple things happen simultaneously — felt slightly flustered at the sendoff moment",
      misconducts: [
        { type: "CAUTION", recipientType: "PLAYER", minute: 38, number: "6", name: "Dario Esposito", reason: "Unsporting behavior", description: "Theatrical dive in the penalty area to win a penalty. Deliberate simulation — correct caution." },
        { type: "CAUTION", recipientType: "PLAYER", minute: 61, number: "6", name: "Dario Esposito", reason: "Dissent by word or action", description: "Berated the referee aggressively after a foul decision went against him. Second bookable offence." },
        { type: "SENDOFF", recipientType: "PLAYER", minute: 62, number: "6", name: "Dario Esposito", reason: "Receiving a second caution", description: "Automatic sendoff following second caution. Player argued the decision but eventually left the field. Bench reaction required 4th official intervention." },
      ],
    },

    {
      matchDate: d("2026-03-01"), matchTime: t("10:00:00"),
      location: "Millbrook Recreation Fields Field 1",
      homeTeam: "North Stars FC", awayTeam: "Riverside FC",
      league: "AYSO Region 10", ageGroup: "U16", positionId: FOUR,
      refereeCrewName: "Pedro Luna", ar1CrewName: "Joe May", ar2CrewName: "Steven Gans", fourthCrewName: null,
      feedbackFromReferee: "Great 4th official work. Board management was professional and you kept both technical areas calm. Made the whole match feel organized.",
      feedbackFromAr1: "Clear communication on substitution timing. You made sure everyone was ready before the stoppage, which made Pedro's job easier.",
      feedbackFromAr2: "Good energy throughout. Your presence kept the technical areas professional and the coaches well-behaved.",
      feedbackForReferee: "Pedro managed the game well and was an excellent communicator with me from the center position. Good table-setting at the start of the match.",
      feedbackForAr1: "Joe had a clean line and good mechanics throughout. His positioning was solid.",
      feedbackForAr2: "Steven was confident and accurate on the line. His decision on the close offside in the 33rd was brave and correct under crowd pressure.",
      personalReflection: "A smooth U16 game that let me focus on the process of the 4th official role. Substitution management was clean and organized. The coaches were well-behaved, which made it a good opportunity to practice the communication patterns.",
      wentWell1: "Substitution process was smooth and efficient throughout",
      wentWell2: "Technical area management was proactive — caught two potential issues early",
      wentWell3: "Good communication loop with Pedro on the timing of stoppages",
      toImprove1: "Need to be more visible in my communication style — some coaches weren't sure where to direct questions",
      toImprove2: "Quicker to call in substitutions to the center to minimize delay",
      toImprove3: null,
      misconducts: [],
    },

    {
      matchDate: d("2026-03-29"), matchTime: t("09:00:00"),
      location: "Riverside Sports Complex Field 3",
      homeTeam: "Dynamo Youth", awayTeam: "FC United",
      league: "AYSO Region 10", ageGroup: "U14", positionId: FOUR,
      refereeCrewName: "Turan Ozdemir", ar1CrewName: "Steve May", ar2CrewName: "Bruno Silva", fourthCrewName: null,
      feedbackFromReferee: "Professional 4th official work throughout. Your interaction with the sideline personnel was firm but respectful — exactly the right approach for a U14 match.",
      feedbackFromAr1: "Great communication on the board. Clear signals made every substitution smooth. Good to work with you.",
      feedbackFromAr2: "Good awareness of the technical area atmosphere. You kept things calm without being heavy-handed.",
      feedbackForReferee: "Turan ran a solid, age-appropriate game. His foul recognition was consistent and the kids enjoyed themselves.",
      feedbackForAr1: "Steve was reliable and consistent. Good positioning throughout the match.",
      feedbackForAr2: "Bruno was attentive with clean line management and good mechanics. Accurate and reliable.",
      personalReflection: "Nice U14 game. The 4th official role at this level is about keeping it simple and supporting the crew. Focused on making substitutions clean and managing the small number of coach interactions with a light touch.",
      wentWell1: "Light-touch approach with coaches was exactly right for the level",
      wentWell2: "Substitution boards were accurate and timely all game",
      wentWell3: "Good crew chemistry — communicated well with all three throughout",
      toImprove1: "Should be quicker to check in with Turan at the half on anything I observed",
      toImprove2: "Positioning during goal kick sequences — drift slightly too close to the area",
      toImprove3: null,
      misconducts: [],
    },

    {
      matchDate: d("2026-05-31"), matchTime: t("14:00:00"),
      location: "Valley Sports Complex Field C",
      homeTeam: "Millbrook FC", awayTeam: "Westside Thunder",
      league: "Adult Recreation League", ageGroup: "Adult / Open", positionId: FOUR,
      refereeCrewName: "Rich Fern", ar1CrewName: "Steven Gans", ar2CrewName: "Joe May", fourthCrewName: null,
      feedbackFromReferee: "Your management of the dissent around the caution was excellent — you had already been talking to that player before I got there. Good situational awareness.",
      feedbackFromAr1: "Clear board signals throughout. Your awareness of substitution timing was excellent — you anticipated when teams would want to make changes.",
      feedbackFromAr2: "Solid communication across the field. You kept me informed when things got heated near the technical area.",
      feedbackForReferee: "Rich had a decisive game and the caution was well-administered and clearly communicated. Strong professional performance.",
      feedbackForAr1: "Steven was consistent and his positioning on the line was excellent. His flags were decisive and clean.",
      feedbackForAr2: "Joe had clean mechanics and good communication. Reliable and accurate throughout.",
      personalReflection: "The caution situation was the main event. By the time Rich got there I had already been talking to the player, which helped the moment be less confrontational. That's exactly what the 4th official should be doing — laying groundwork. Pleased with the game.",
      wentWell1: "Pre-empted the caution by engaging the player before Rich arrived — eased the moment",
      wentWell2: "Technical area management in an adult game — firm but not over-managing",
      wentWell3: "Substitution timing awareness — anticipated changes and was ready before teams asked",
      toImprove1: "Need to communicate more explicitly to Rich what I'm managing on the sideline",
      toImprove2: "Positioning when the game moves into the final third on my side — should track it better",
      toImprove3: "One substitution board came out slightly too early — check with center first",
      misconducts: [
        { type: "CAUTION", recipientType: "PLAYER", minute: 45, number: "8", name: "Kyle Anderson", reason: "Failure to respect the required distance", description: "Refused to retreat the required distance on a free kick despite repeated instruction from the referee. 4th official had already spoken to him once." },
      ],
    },
  ];

  console.log(`\nCreating ${reports.length} match reports...\n`);
  for (const r of reports) {
    const { misconducts, ...reportData } = r;
    const created = await prisma.matchReport.create({ data: reportData });
    if (misconducts.length > 0) {
      await prisma.misconduct.createMany({
        data: misconducts.map(m => ({ ...m, matchReportId: created.id })),
      });
    }
    console.log(`  [${created.id}] ${r.homeTeam} vs ${r.awayTeam} (${r.ageGroup}, ${r.league})${misconducts.length > 0 ? ` — ${misconducts.length} card(s)` : ""}`);
  }

  console.log("\nDone.");
}

main().catch(console.error).finally(() => pool.end());
