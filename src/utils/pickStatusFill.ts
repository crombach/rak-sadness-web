import { Status } from "../types/RakMadnessScores";

/**
 * The fill behind a pick, by whether it scored.
 *
 * Keep in sync with the `--rak-pick-*` tokens in `src/index.scss`, which color
 * the same statuses in the browser. The two cannot share one value: this side
 * needs bare hex for xlsx, and the stylesheet needs a CSS color.
 */
export const PICK_STATUS_FILL: Record<Status, { rgb: string }> = {
  yes: { rgb: "A3FAA0" },
  no: { rgb: "FAA0A0" },
  error: { rgb: "EDFAA0" },
  incomplete: { rgb: "FFFFFF" },
};
