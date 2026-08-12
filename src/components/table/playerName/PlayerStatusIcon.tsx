import { useIsWeekDecided } from "../../../context/AppDataContext";
import {
  EmojiEventsIcon,
  SentimentVerySatisfiedIcon,
  SkullIcon,
} from "../../icon/Icon";
import "./PlayerStatusIcon.scss";

/**
 * Where a player stands, in one icon. Shared by the tables' name cells and the
 * player analysis search, so the same player is marked the same way in both.
 *
 * Still standing at the end of the week is what winning the week is.
 */
export default function PlayerStatusIcon({
  isKnockedOut,
}: {
  isKnockedOut: boolean;
}) {
  const isWeekDecided = useIsWeekDecided();

  return (
    <span className="player-status-icon">
      {isKnockedOut ? (
        <SkullIcon />
      ) : isWeekDecided ? (
        <EmojiEventsIcon />
      ) : (
        <SentimentVerySatisfiedIcon />
      )}
    </span>
  );
}
