import { memo } from "react";
import { PlayerScore } from "../../../types/RakMadnessScores";
import getClasses from "../../../utils/getClasses";
import {
  SentimentVeryDissatisfied,
  SentimentVerySatisfied,
} from "@mui/icons-material";
import { useToastContext, Toast } from "../../../context/ToastContext";
import "./PlayerName.scss";

function PlayerName({ player }: { player: PlayerScore }) {
  const { showToast, clearToasts } = useToastContext();

  return (
    <td
      className={`table__player-col ${getClasses({
        "--knocked-out": player.status.isKnockedOut,
      })}`}
      role="button"
      onClick={() => {
        clearToasts();
        showToast(new Toast("neutral", null, player.status.explanation));
      }}
    >
      <div className="player-name">
        <span>{player.name}</span>
        <span className="player-name__status-icon">
          {player.status.isKnockedOut ? (
            <SentimentVeryDissatisfied />
          ) : (
            <SentimentVerySatisfied />
          )}
        </span>
      </div>
    </td>
  );
}

export default memo(PlayerName);
