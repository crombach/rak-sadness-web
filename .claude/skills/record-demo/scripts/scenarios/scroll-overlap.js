import {
  buildPicksWorkbook,
  makeGame,
  registerAppMocks,
} from "../lib/mocks.js";

const SEASON = 2024;
const WEEK = 5;

const ROWS = [
  {
    Name: "Alice",
    P1: "KC",
    P2: "SF",
    P3: "MIA",
    P4: "GB",
    P5: "BAL",
    P6: "LAC",
  },
  {
    Name: "Bob",
    P1: "BUF",
    P2: "DAL",
    P3: "NYJ",
    P4: "CHI",
    P5: "CIN",
    P6: "DEN",
  },
  {
    Name: "Carol",
    P1: "KC",
    P2: "DAL",
    P3: "MIA",
    P4: "CHI",
    P5: "BAL",
    P6: "LAC",
  },
  {
    Name: "Dave",
    P1: "BUF",
    P2: "SF",
    P3: "NYJ",
    P4: "GB",
    P5: "CIN",
    P6: "LAC",
  },
  {
    Name: "Erin",
    P1: "KC",
    P2: "SF",
    P3: "NYJ",
    P4: "GB",
    P5: "BAL",
    P6: "DEN",
  },
  {
    Name: "Frank",
    P1: "BUF",
    P2: "DAL",
    P3: "MIA",
    P4: "CHI",
    P5: "CIN",
    P6: "LAC",
  },
  {
    Name: "Grace",
    P1: "KC",
    P2: "SF",
    P3: "MIA",
    P4: "",
    P5: "BAL",
    P6: "LAC",
  },
  {
    Name: "Heidi",
    P1: "BUF",
    P2: "DAL",
    P3: "NYJ",
    P4: "CHI",
    P5: "BAL",
    P6: "DEN",
  },
];

function events() {
  return {
    events: [
      makeGame("P1EVT", "KC", "BUF", 24, 17, "3"),
      makeGame("P2EVT", "SF", "DAL", 27, 20, "3"),
      makeGame("P3EVT", "NYJ", "MIA", 16, 20, "3"),
      makeGame("P4EVT", "CHI", "GB", 10, 24, "3"),
      makeGame("P5EVT", "BAL", "CIN", 24, 17, "3"),
      makeGame("P6EVT", "DEN", "LAC", 13, 27, "3"),
    ],
  };
}

/**
 * Pans the picks table right across its colored pick columns. The player
 * column stays pinned left and legible the whole way, proving
 * `src/components/table/Table.scss`'s `:has(.table__cell-wipe)` scoping keeps
 * an ordinary (non-wiping) pick cell's button unpositioned, so it cannot
 * paint over the sticky column.
 */
export default async function run({ page, context, baseUrl }) {
  await registerAppMocks(context, {
    season: SEASON,
    week: WEEK,
    xlsxBuffer: buildPicksWorkbook(ROWS),
    events,
  });

  await page.goto(`${baseUrl}/${SEASON}/${WEEK}/picks`);
  await page.waitForSelector("td.table__pick", { timeout: 20000 });
  await page.waitForTimeout(500);

  const scroller = page.locator(".page__content");
  const maxScroll = await scroller.evaluate(
    (el) => el.scrollWidth - el.clientWidth,
  );
  const steps = 24;
  for (let i = 1; i <= steps; i++) {
    const left = Math.round((maxScroll * i) / steps);
    await scroller.evaluate((el, left) => {
      el.scrollLeft = left;
    }, left);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(600);
}
