

import { memo } from "react";
import { PlayerScore } from "../../../types/RakMadnessScores";
import getClasses from "../../../utils/getClasses";
import Button from "@mui/joy/Button";
import { QuestionMark } from "@mui/icons-material";
import { useToastContext, Toast } from "../../../context/ToastContext";
import "./PlayerName.css"

function PlayerName({ player }: { player: PlayerScore }) {
    const { showToast, clearToasts } = useToastContext();

    return (
        <td className={`table__player-col player-name ${getClasses({
            "--knocked-out": player.status.isKnockedOut
        })}`}>
                <span>{player.name}</span>
                {!!player.status.explanation && <Button
                    className="player-name__explanation-button"
                    variant="plain"
                    color="neutral"
                    onClick={() => {
                        clearToasts();
                        showToast(new Toast("neutral", null, player.status.explanation));
                    }}
                >
                    <QuestionMark />
                </Button>}
        </td>
    );
}


export default memo(PlayerName);