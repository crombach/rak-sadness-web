// Capture group 1 is team abbreviation, capture group 3 is spread (if present)
const pickRegex = /([^\s+-]+)(\s*([+-]?\d+(\.\d)?))?/;

export default function parsePick(pickString: string) {
  const match = pickRegex.exec(pickString);
  const [, teamAbbreviation, , spreadText] = match ?? [];
  const spread = spreadText != null ? Number(spreadText) : 0;
  return {
    teamAbbreviation:
      teamAbbreviation !== "undefined"
        ? teamAbbreviation.toUpperCase()
        : undefined,
    spread,
  };
}
