import { buildPicksWorkbook, makeGame, registerAppMocks } from "../lib/mocks.js";

const SEASON = 2024;
const WEEK = 5;

const ROWS = [
  { Name: "Alice", P1: "KC", P2: "SF" },
  { Name: "Bob", P1: "BUF", P2: "DAL" },
];

function events() {
  return {
    events: [
      makeGame("P1EVT", "KC", "BUF", 24, 17, "3"),
      makeGame("P2EVT", "SF", "DAL", 27, 20, "3"),
    ],
  };
}

/**
 * Clicks the ScoresNavbar's Scoreboard/Picks switch back and forth rapidly,
 * to show the selected fill settling in one move instead of flashing
 * through a lighter tone (src/components/button/Button.scss's
 * `&.--primary.--selected`).
 */
export default async function run({ page, context, baseUrl }) {
  await registerAppMocks(context, {
    season: SEASON,
    week: WEEK,
    xlsxBuffer: buildPicksWorkbook(ROWS),
    events,
  });

  await page.goto(`${baseUrl}/${SEASON}/${WEEK}/scoreboard`);
  const nav = page.locator('nav[aria-label="Results view"]');
  await nav.waitFor({ state: "visible", timeout: 20000 });
  const buttons = nav.locator("button");
  const scoreboardBtn = buttons.nth(0);
  const picksBtn = buttons.nth(1);
  await page.waitForTimeout(400);

  for (let i = 0; i < 8; i++) {
    await picksBtn.click();
    await page.waitForTimeout(90);
    await scoreboardBtn.click();
    await page.waitForTimeout(90);
  }
  await picksBtn.click();
  await page.waitForTimeout(500);
}
