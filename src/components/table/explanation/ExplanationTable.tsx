import { memo } from "react";
import { PlayerScore, RakMadnessScores } from "../../../types/RakMadnessScores";
import "../Table.css";
import "./ExplanationTable.css";
import rangeWithPrefix from "../../../utils/rangeWithPrefix";
import getClasses from "../../../utils/getClasses";

function leagueHeaders(count: number, prefix: string) {
    return rangeWithPrefix(count, prefix).map(header => (
        <th key={header}>
            <span className="table__pick-header">{header}</span>
        </th>
    ));
}

function ExplanationTable({ scores }: { scores?: RakMadnessScores }) {
    if (scores == null) {
        return null;
    }

    const firstPlayer = scores.scores[0];
    const collegeHeaders = leagueHeaders(firstPlayer.college.length, "C");
    const proHeaders = leagueHeaders(firstPlayer.pro.length, "P");

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
                    return <tr key={player.name}>
                        <td><b>{index + 1}</b></td>
                        <td className={`table__player-col ${getClasses({
                            "--knocked-out": player.isKnockedOut
                        })}`}>{player.name}</td>
                        {player.college.map((result, index) =>
                            <td
                                key={`${player.name}-C${index + 1}`}
                                className={`table__center table__pick --${result.correct}`}
                            >
                                {result.pick || "N/A"}
                            </td>
                        )}
                        <td className="table__center">{player.score.college}</td>
                        {player.pro.map((result, index) =>
                            <td
                                key={`${player.name}-P${index + 1}`}
                                className={`table__center table__pick --${result.correct}`}
                            >
                                {result.pick || "N/A"}
                            </td>
                        )}
                        <td className="table__center">{player.score.pro}</td>
                        <td className="table__center"><b>{player.score.total}</b></td>
                    </tr>
                })}
            </tbody>
        </table>
    );
}

export default memo(ExplanationTable);