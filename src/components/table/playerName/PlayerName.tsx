import { memo } from "react";
import { PlayerScore } from "../../../types/RakMadnessScores";
import getClasses from "../../../utils/getClasses";
import {
  EmojiEventsIcon,
  SentimentVerySatisfiedIcon,
  SkullIcon,
} from "../../icon/Icon";
import { useIsWeekDecided } from "../../../context/AppDataContext";
import { useToastActions, Toast } from "../../../context/ToastContext";
import "./PlayerName.scss";

/** Still standing at the end of the week, which is what winning the week is. */
function statusIcon(player: PlayerScore, isWeekDecided: boolean) {
  if (player.status.isKnockedOut) {
    return <SkullIcon />;
  }
  return isWeekDecided ? <EmojiEventsIcon /> : <SentimentVerySatisfiedIcon />;
}

function PlayerName({ player }: { player: PlayerScore }) {
  const { showToast, clearToasts } = useToastActions();
  const isWeekDecided = useIsWeekDecided();

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
          {statusIcon(player, isWeekDecided)}
        </span>
      </div>
    </td>
  );
}

export default memo(PlayerName);
