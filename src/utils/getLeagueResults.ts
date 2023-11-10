import { LeagueResult } from "../types/LeagueResult";
import { EspnCompetitor, EspnEvent } from "../types/ESPN";
import { League } from "../types/League";

/**
 * Get the results for a given league in a given week.
 * 
 * @param league league for which to get results
 * @param week week in the season (week 1 is the first NFL week)
 * @returns league results
 */
export async function getLeagueResults(league: League, week: number): Promise<Array<LeagueResult>> {
    // Week 1 of Rak Madness is week 1 in the NFL, but week 2 in the NCAA.
    // We account for this by adding 1 to the week if NCAA results have been requested.
    const adjustedWeek = league === League.COLLEGE ? week + 1 : week;
    // Group 80 includes all college games, not just the top few.
    const extraParams = league === League.COLLEGE ? "&limit=200&groups=80" : "";

    // Build final request URL.
    const requestUrl = `http://site.api.espn.com/apis/site/v2/sports/football/${league}/scoreboard?week=${adjustedWeek}${extraParams}`;

    const response = await fetch(requestUrl);
    const json = await response.json();

    return json.events.filter((event: EspnEvent) => event.status.type.completed).map((event: EspnEvent) => {
        const home = event.competitions[0].competitors.find((competitor: EspnCompetitor) => {
            return competitor.homeAway === "home";
        });
        const away = event.competitions[0].competitors.find((competitor: EspnCompetitor) => {
            return competitor.homeAway === "away";
        });

        const homeScore = Number(home.score);
        const awayScore = Number(away.score);

        let winner;
        if (homeScore > awayScore) {
            winner = home;
        } else if (awayScore > homeScore) {
            winner = away;
        } else {
            winner = null;
        }

        const winnerScore = (winner === home) ? homeScore : awayScore;
        const loserScore = (winner === home) ? awayScore : homeScore;

        return {
            name: event.name,
            shortName: event.shortName,
            home: {
                team: {
                    name: home.team.displayName,
                    abbreviation: home.team.abbreviation?.toUpperCase(),
                },
                score: homeScore,
            },
            away: {
                team: {
                    name: away.team.displayName,
                    abbreviation: away.team.abbreviation?.toUpperCase(),
                },
                score: awayScore,
            },
            winner: {
                team: winner && {
                    name: winner.team.displayName,
                    abbreviation: winner.team.abbreviation?.toUpperCase(),
                },
                by: winnerScore - loserScore,
            },
            totalScore: winnerScore + loserScore,
        };
    });
}