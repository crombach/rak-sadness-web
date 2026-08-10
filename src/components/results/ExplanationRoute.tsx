import { useAppData } from "../../context/AppDataContext";
import ExplanationTable from "../table/explanation/ExplanationTable";

export default function ExplanationRoute() {
  return <ExplanationTable scores={useAppData().scores} />;
}
