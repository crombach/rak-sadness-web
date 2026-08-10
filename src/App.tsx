import { Navigate, Route, Routes } from "react-router";
import HomePage from "./components/home/HomePage";
import ExplanationRoute from "./components/results/ExplanationRoute";
import ResultsLayout from "./components/results/ResultsLayout";
import ScoreboardRoute from "./components/results/ScoreboardRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/week/:week" element={<ResultsLayout />}>
        <Route index element={<Navigate to="scoreboard" replace />} />
        <Route path="scoreboard" element={<ScoreboardRoute />} />
        <Route path="explanation" element={<ExplanationRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
