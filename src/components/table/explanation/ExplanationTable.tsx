import { memo, useCallback } from "react";
import {
  PickResult,
  PlayerScore,
  RakMadnessScores,
} from "../../../types/RakMadnessScores";
import rangeWithPrefix from "../../../utils/rangeWithPrefix";
import PlayerName from "../playerName/PlayerName";
import "../Table.scss";
import "./ExplanationTable.scss";
import { useToastContext, Toast } from "../../../context/ToastContext";

function leagueHeaders(count: number, prefix: string) {
  return rangeWithPrefix(count, prefix).map((header) => (
    <th key={header}>
      <span className="table__pick-header">{header}</span>
    </th>
  ));
}

function ExplanationTable({ scores }: { scores?: RakMadnessScores }) {
  if (scores == null) {
    return null;
  }

  const { showToast, clearToasts } = useToastContext();

  const firstPlayer = scores.scores[0];
  const collegeHeaders = leagueHeaders(firstPlayer.college.length, "C");
  const proHeaders = leagueHeaders(firstPlayer.pro.length, "P");

  const handlePickResultClick = useCallback((result: PickResult) => {
    clearToasts();
    showToast(
      new Toast(
        "neutral",
        result.explanation.header,
        result.explanation.message,
      ),
    );
  }, []);

  return (
    <table className="table" cellSpacing="0">
      <thead className="table__header">
        <tr>
          <th>Rank</th>
          <th className="table__player-col">Player</th>
          {collegeHeaders}
          <th>College Score</th>
          {proHeaders}
          <th>Pro Score</th>
          <th>Total Score</th>
        </tr>
      </thead>
      <tbody>
        {scores.scores.map((player: PlayerScore, index: number) => {
          return (
            <tr key={player.name}>
              <td>
                <b>{index + 1}</b>
              </td>
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
        {/* Empty last row */}
        <tr className="table__last-row">
          <td />
          <td />
          {scores.scores[0].college.map((_, index) => (
            <td key={`C${index + 1}-empty`} />
          ))}
          <td />
          {scores.scores[0].pro.map((_, index) => (
            <td key={`P${index + 1}-empty`} />
          ))}
          <td />
          <td />
        </tr>
      </tbody>
    </table>
  );
}

export default memo(ExplanationTable);
