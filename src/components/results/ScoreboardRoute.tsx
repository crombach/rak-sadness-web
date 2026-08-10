import { useAppData } from "../../context/AppDataContext";
import ScoresTable from "../table/scores/ScoresTable";

export default function ScoreboardRoute() {
  return <ScoresTable scores={useAppData().scores} />;
}
