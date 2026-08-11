import { memo } from "react";
import { PlayerScore } from "../../../types/RakMadnessScores";
import getClasses from "../../../utils/getClasses";
import {
  SentimentVeryDissatisfiedIcon,
  SentimentVerySatisfiedIcon,
} from "../../icon/Icon";
import { useToastActions, Toast } from "../../../context/ToastContext";
import "./PlayerName.scss";

function PlayerName({ player }: { player: PlayerScore }) {
  const { showToast, clearToasts } = useToastActions();

  return (
    <td
      className={`table__player-col ${getClasses({
        "--knocked-out": player.status.isKnockedOut,
      })}`}
      role="button"
      onClick={() => {
        clearToasts();
        showToast(
          new Toast("neutral", player.name, player.status.explanation ?? ""),
        );
      }}
    >
      <div className="player-name">
        <span className="player-name__name">{player.name}</span>
        <span className="player-name__status-icon">
          {player.status.isKnockedOut ? (
            <SentimentVeryDissatisfiedIcon />
          ) : (
            <SentimentVerySatisfiedIcon />
          )}
        </span>
      </div>
    </td>
  );
}

export default memo(PlayerName);
