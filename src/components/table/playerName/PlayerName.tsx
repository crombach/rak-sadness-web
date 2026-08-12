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
      role="button"
      onClick={() => showPlayerAnalysis(player.name)}
    >
      <div className="player-name">
        <span className="player-name__name">{player.name}</span>
        <PlayerStatusIcon isKnockedOut={player.status.isKnockedOut} />
      </div>
    </td>
  );
}

export default memo(PlayerName);
