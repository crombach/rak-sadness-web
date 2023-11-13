import { PlayerScore, RakMadnessScores } from "../../types/RakMadnessScores";
import "./ScoresTable.css";

export default function ScoresTable({ scores }: { scores?: RakMadnessScores }) {
    if (scores == null) {
        return null;
    }

    return (
        <table className="scores-table" cellSpacing="0">
            <thead className="scores-table__header">
                <tr>
                    <th>Rank</th>
                    <th className="scores-table__player-col">Player</th>
                    <th>Tiebreaker Pick</th>
                    <th>Tiebreaker Distance</th>
                    <th>College Score</th>
                    <th>Pro Score</th>
                    <th>Pro Score Against the Spread</th>
                    <th>Total Score</th>
                </tr>
            </thead>
            <tbody>
                {scores.scores.map((player: PlayerScore, index: number) => {
                    return <tr key={player.name}>
                        <td><b>{index + 1}</b></td>
                        <td className="scores-table__player-col">{player.name}</td>
                        <td>{player.tiebreaker.pick ?? "N/A"}</td>
                        <td>{player.tiebreaker.distance ?? "N/A"}</td>
                        <td>{player.score.college}</td>
                        <td>{player.score.pro}</td>
                        <td>{player.score.proAgainstTheSpread}</td>
                        <td><b>{player.score.total}</b></td>
                    </tr>
                })}
            </tbody>
        </table>
    );
}