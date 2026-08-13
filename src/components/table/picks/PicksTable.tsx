import { memo } from "react";
import { useShowGameStatus } from "../../../context/GameStatusContext";
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

function leagueHeaders(labels: Array<string>) {
  return labels.map((header) => (
    // The class is what gives a game's column its width, which the wireframe gives
    // the same column before there is a game in it.
    <th key={header} className="table__pick-col" scope="col">
      {header}
    </th>
  ));
}

function PickCell({
  result,
  gameLabel,
  onClick,
}: {
  result: PickResult;
  /** The column this cell is in, which is what names the game behind it. */
  gameLabel: string;
  onClick: (gameLabel: string) => void;
}) {
  const statusLabel = PICK_STATUS_LABEL[result.status];
  return (
    <button
      type="button"
      className="table__cell-button"
      onClick={() => onClick(gameLabel)}
    >
      <span>{result.pick || "N/A"}</span>
      {statusLabel && <span className="table__sr-only">{statusLabel}</span>}
    </button>
  );
}

function PicksTable({ scores }: { scores?: RakMadnessScores | null }) {
  const showGameStatus = useShowGameStatus();

  if (scores == null) {
    return null;
  }

  const firstPlayer = scores.scores[0];
  const collegeCount = firstPlayer.college.length;
  const proCount = firstPlayer.pro.length;
  const columnCount = FIXED_COLUMN_COUNT + collegeCount + proCount;
  // Built once for the headers and every row's cells, so a cell and the column it
  // sits under cannot disagree about which game they mean.
  const collegeLabels = rangeWithPrefix(collegeCount, "C");
  const proLabels = rangeWithPrefix(proCount, "P");

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
          {leagueHeaders(collegeLabels)}
          <th scope="col">College Score</th>
          {leagueHeaders(proLabels)}
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
                key={`${player.name}-${collegeLabels[index]}`}
                className={`table__pick --${result.status}`}
              >
                <PickCell
                  result={result}
                  gameLabel={collegeLabels[index]}
                  onClick={showGameStatus}
                />
              </td>
            ))}
            <td>{player.score.college}</td>
            {player.pro.map((result, index) => (
              <td
                key={`${player.name}-${proLabels[index]}`}
                className={`table__pick --${result.status}`}
              >
                <PickCell
                  result={result}
                  gameLabel={proLabels[index]}
                  onClick={showGameStatus}
                />
              </td>
            ))}
            <td>{player.score.pro}</td>
            <td>
              <b>{player.score.total}</b>
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

export default memo(PicksTable);
