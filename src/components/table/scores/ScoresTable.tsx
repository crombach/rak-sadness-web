import { memo } from "react";
import { PlayerScore, RakMadnessScores } from "../../../types/RakMadnessScores";
import PlayerName from "../playerName/PlayerName";
import TableShell, { RankCell } from "../TableShell";

const COLUMN_COUNT = 8;

function ScoresTable({ scores }: { scores?: RakMadnessScores | null }) {
  if (scores == null) {
    return null;
  }

  return (
    <TableShell
      columnCount={COLUMN_COUNT}
      header={
        <>
          <th>Rank</th>
          <th className="table__player-col">Player</th>
          <th>MNF Points Pick</th>
          <th>MNF Points Distance</th>
          <th>College Score</th>
          <th>Pro Score</th>
          <th>Pro Score ATS</th>
          <th>Total Score</th>
        </>
      }
    >
      {scores.scores.map((player: PlayerScore, index: number) => (
        <tr key={player.name}>
          <RankCell rank={index + 1} />
          <PlayerName player={player} />
          <td>{player.tiebreaker.pick ?? "N/A"}</td>
          <td>{player.tiebreaker.distance ?? "N/A"}</td>
          <td>{player.score.college}</td>
          <td>{player.score.pro}</td>
          <td>{player.score.proAgainstTheSpread}</td>
          <td>
            <b>{player.score.total}</b>
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

export default memo(ScoresTable);
