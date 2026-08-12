import { memo, useCallback } from "react";
import {
  PickResult,
  PlayerScore,
  RakMadnessScores,
  Status,
} from "../../../types/RakMadnessScores";
import rangeWithPrefix from "../../../utils/rangeWithPrefix";
import PlayerName from "../playerName/PlayerName";
import TableShell, { RankCell } from "../TableShell";
import "./PicksTable.scss";
import { useToastActions, Toast } from "../../../context/ToastContext";

/** Rank, player, college score, pro score, and total score. */
const FIXED_COLUMN_COUNT = 5;

/**
 * A pick's status, in words, for the fill color a sighted reader gets instead.
 * `incomplete` carries no entry: it draws no color of its own either, so there is
 * nothing sighted that a screen reader needs to catch up on.
 */
const PICK_STATUS_LABEL: Partial<Record<Status, string>> = {
  yes: "Right",
  no: "Wrong",
  unscoreable: "Unscoreable",
};

function leagueHeaders(count: number, prefix: string) {
  return rangeWithPrefix(count, prefix).map((header) => (
    <th key={header} scope="col">
      <span className="table__pick-header">{header}</span>
    </th>
  ));
}

function PickCell({
  result,
  onClick,
}: {
  result: PickResult;
  onClick: (result: PickResult) => void;
}) {
  const statusLabel = PICK_STATUS_LABEL[result.status];
  return (
    <button
      type="button"
      className="table__cell-button"
      onClick={() => onClick(result)}
    >
      <span>{result.pick || "N/A"}</span>
      {statusLabel && <span className="table__sr-only">{statusLabel}</span>}
    </button>
  );
}

function PicksTable({ scores }: { scores?: RakMadnessScores | null }) {
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
  const columnCount = FIXED_COLUMN_COUNT + collegeCount + proCount;

  return (
    <TableShell
      caption="Player picks for the week, college and pro games"
      columnCount={columnCount}
      header={
        <>
          <th scope="col">Rank</th>
          <th className="table__player-col" scope="col">
            Player
          </th>
          {leagueHeaders(collegeCount, "C")}
          <th scope="col">College Score</th>
          {leagueHeaders(proCount, "P")}
          <th scope="col">Pro Score</th>
          <th scope="col">Total Score</th>
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
              >
                <PickCell result={result} onClick={handlePickResultClick} />
              </td>
            ))}
            <td className="table__center">{player.score.college}</td>
            {player.pro.map((result, index) => (
              <td
                key={`${player.name}-P${index + 1}`}
                className={`table__center table__pick --${result.status}`}
              >
                <PickCell result={result} onClick={handlePickResultClick} />
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

export default memo(PicksTable);
