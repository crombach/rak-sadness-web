import { memo } from "react";
import { PlayerScore } from "../../../types/RakMadnessScores";
import getClasses from "../../../utils/getClasses";
import { useShowPlayerAnalysis } from "../../../context/PlayerAnalysisContext";
import PlayerStatusIcon from "./PlayerStatusIcon";
import "./PlayerName.scss";

function PlayerName({ player }: { player: PlayerScore }) {
  const showPlayerAnalysis = useShowPlayerAnalysis();

  return (
    <td
      className={`table__player-col ${getClasses({
        "--knocked-out": player.status.isKnockedOut,
      })}`}
    >
      <button
        type="button"
        className="table__cell-button"
        onClick={() => showPlayerAnalysis(player.name)}
      >
        <span className="player-name">
          <span className="player-name__name">{player.name}</span>
          <PlayerStatusIcon isKnockedOut={player.status.isKnockedOut} />
        </span>
        <span className="table__sr-only">
          {player.status.isKnockedOut ? "Knocked out" : "Still in contention"}
        </span>
      </button>
    </td>
  );
}

export default memo(PlayerName);
