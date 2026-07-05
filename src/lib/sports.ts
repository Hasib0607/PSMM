export type SportsFixture = {
  id: string;
  sport: string;
  title: string;
  type: string;
  status: string;
  score: string;
  suggestion: string;
};

/** Fetch live/recent sports events from TheSportsDB (free, no API key). */
export async function getLiveSportsEvents(): Promise<SportsFixture[]> {
  const today = new Date().toISOString().split("T")[0];
  const fixtures: SportsFixture[] = [];

  try {
    const [cricketRes, soccerRes] = await Promise.all([
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Cricket`, {
        next: { revalidate: 300 },
      }),
      fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Soccer`, {
        next: { revalidate: 300 },
      }),
    ]);

    const cricketData = cricketRes.ok ? await cricketRes.json() : { events: null };
    const soccerData = soccerRes.ok ? await soccerRes.json() : { events: null };

    const events = [
      ...(cricketData.events || []).map((e: Record<string, string>) => ({ ...e, sport: "cricket" })),
      ...(soccerData.events || []).map((e: Record<string, string>) => ({ ...e, sport: "football" })),
    ];

    for (const event of events.slice(0, 6)) {
      const home = event.strHomeTeam || "TBD";
      const away = event.strAwayTeam || "TBD";
      const homeScore = event.intHomeScore ?? "-";
      const awayScore = event.intAwayScore ?? "-";
      const status = event.strStatus || event.strProgress || "Scheduled";
      const league = event.strLeague || event.strSport || "Match";

      const isLive =
        status.toLowerCase().includes("live") ||
        status === "1H" ||
        status === "2H" ||
        status === "HT" ||
        status === "In Progress";

      fixtures.push({
        id: event.idEvent || `${home}-${away}`,
        sport: event.sport,
        title: `${home} vs ${away}`,
        type: league,
        status: isLive ? `Live (${status})` : status,
        score: `${home}: ${homeScore} | ${away}: ${awayScore}`,
        suggestion: isLive
          ? `Write a live reaction post about ${home} vs ${away} (${league}). Current score: ${homeScore}-${awayScore}.`
          : `Preview or hype post for upcoming ${league} match: ${home} vs ${away}.`,
      });
    }
  } catch (error) {
    console.error("Sports API fetch failed:", error);
  }

  return fixtures;
}
