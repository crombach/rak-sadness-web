import { memo, useCallback } from "react";
import {
  PickResult,
  PlayerScore,
  RakMadnessScores,
} from "../../../types/RakMadnessScores";
import rangeWithPrefix from "../../../utils/rangeWithPrefix";
import PlayerName from "../playerName/PlayerName";
import TableShell, { RankCell } from "../TableShell";
import "./ExplanationTable.scss";
import { useToastActions, Toast } from "../../../context/ToastContext";

/** Rank, player, college score, pro score, and total score. */
const FIXED_COLUMN_COUNT = 5;

function leagueHeaders(count: number, prefix: string) {
  return rangeWithPrefix(count, prefix).map((header) => (
    <th key={header}>
      <span className="table__pick-header">{header}</span>
    </th>
  ));
}

function ExplanationTable({ scores }: { scores?: RakMadnessScores | null }) {
  const { showToast, clearToasts } = useToastActions();

  const handlePickResultClick = useCallback(
    (result: PickResult) => {
      clearToasts();
      showToast(
        new Toast(
          "neutral",
          result.explanation.header,
          <>
            {result.explanation.message}
            {result.explanation.downDistanceText && <br />}
            {result.explanation.downDistanceText}
          </>,
        ),
      );
    },
    [clearToasts, showToast],
  );

  if (scores == null) {
    return null;
  }

  const firstPlayer = scores.scores[0];
  const collegeCount = firstPlayer.college.length;
  const proCount = firstPlayer.pro.length;
  // Rank, player, college score, pro score, total score, plus one per pick.
  const columnCount = FIXED_COLUMN_COUNT + collegeCount + proCount;

  return (
    <TableShell
      columnCount={columnCount}
      header={
        <>
          <th>Rank</th>
          <th className="table__player-col">Player</th>
          {leagueHeaders(collegeCount, "C")}
          <th>College Score</th>
          {leagueHeaders(proCount, "P")}
          <th>Pro Score</th>
          <th>Total Score</th>
        </>
      }
    >
      {scores.scores.map((player: PlayerScore, index: number) => {
        return (
          <tr key={player.name}>
            <RankCell rank={index + 1} />
            <PlayerName player={player} />
            {player.college.map((result, index) => (
              <td
                key={`${player.name}-C${index + 1}`}
                className={`table__center table__pick --${result.status}`}
                role="button"
                onClick={() => handlePickResultClick(result)}
              >
                {result.pick || "N/A"}
              </td>
            ))}
            <td className="table__center">{player.score.college}</td>
            {player.pro.map((result, index) => (
              <td
                key={`${player.name}-P${index + 1}`}
                className={`table__center table__pick --${result.status}`}
                role="button"
                onClick={() => handlePickResultClick(result)}
              >
                {result.pick || "N/A"}
              </td>
            ))}
            <td className="table__center">{player.score.pro}</td>
            <td className="table__center">
              <b>{player.score.total}</b>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

export default memo(ExplanationTable);
