import { useState } from "react";

/**
 * Takes a value handed in from outside as it arrives, and only then.
 *
 * Taken during the render that brings it rather than in an effect, so whatever it
 * decides is worked out in the same pass rather than a beat behind it.
 *
 * Only an arrival is acted on. A dialog clears the value on its way out, and taking
 * that would empty the dialog while it is still fading out.
 */
export default function useArrival<T>(
  incoming: T | undefined,
  onArrive: (value: T) => void,
): void {
  const [arrived, setArrived] = useState(incoming);
  if (incoming !== arrived) {
    setArrived(incoming);
    if (incoming != null) {
      onArrive(incoming);
    }
  }
}
