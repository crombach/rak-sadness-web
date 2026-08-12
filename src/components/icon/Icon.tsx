import { ReactNode } from "react";
import "./Icon.scss";

/**
 * The icon set, drawn from path data copied verbatim out of
 * `@mui/icons-material`, which ships Material Design icons under Apache 2.0.
 *
 * Inlined rather than imported because those components are built on
 * `@mui/material`'s `createSvgIcon`, which pulled `@mui/material` and emotion into
 * the bundle for the sake of ten shapes. The `<svg>` here carries the same box and
 * fill rules that `SvgIcon` applied, so nothing downstream had to be resized.
 *
 * One shape comes from Material Symbols instead, which that package does not
 * carry. Same icon, same licence, filled style to match the rest, with its path
 * data rescaled from Symbols' `0 -960 960 960` box onto the standard one here so
 * it drops onto the same grid as everything else.
 */
function Icon({ name, children }: { name: string; children: ReactNode }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      // The name `@mui/icons-material` put here, which the toaster suite looks an
      // icon up by. An icon is decorative, so there is nothing else to find it by.
      data-testid={name}
    >
      {children}
    </svg>
  );
}

export function UnfoldMoreIcon() {
  return (
    <Icon name="UnfoldMoreIcon">
      <path d="M12 5.83 15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15z" />
    </Icon>
  );
}

export function InfoIcon() {
  return (
    <Icon name="InfoIcon">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-6h2zm0-8h-2V7h2z" />
    </Icon>
  );
}

export function FactCheckIcon() {
  return (
    <Icon name="FactCheckIcon">
      <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2M10 17H5v-2h5zm0-4H5v-2h5zm0-4H5V7h5zm4.82 6L12 12.16l1.41-1.41 1.41 1.42L17.99 9l1.42 1.42z" />
    </Icon>
  );
}

export function LeaderboardIcon() {
  return (
    <Icon name="LeaderboardIcon">
      <path d="M7.5 21H2V9h5.5zm7.25-18h-5.5v18h5.5zM22 11h-5.5v10H22z" />
    </Icon>
  );
}

export function RefreshIcon() {
  return (
    <Icon name="RefreshIcon">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z" />
    </Icon>
  );
}

export function EmojiEventsIcon() {
  return (
    <Icon name="EmojiEventsIcon">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2M5 8V7h2v3.82C5.84 10.4 5 9.3 5 8m14 0c0 1.3-.84 2.4-2 2.82V7h2z" />
    </Icon>
  );
}

export function SkullIcon() {
  return (
    <Icon name="SkullIcon">
      <path d="M10.5 15.75h3l-1.5-3-1.5 3Zm-2-2.75q.83 0 1.41-.59T10.5 11q0-.83-.59-1.41T8.5 9q-.83 0-1.41.59T6.5 11q0 .83.59 1.41T8.5 13Zm7 0q.83 0 1.41-.59T17.5 11q0-.83-.59-1.41T15.5 9q-.83 0-1.41.59T13.5 11q0 .83.59 1.41T15.5 13ZM6 22v-4.25q-.98-.43-1.71-1.14t-1.25-1.61q-.51-.9-.78-1.93T2 11q0-3.95 2.8-6.48t7.2-2.53q4.4 0 7.2 2.53t2.8 6.48q0 1.05-.26 2.08t-.78 1.93q-.51.9-1.25 1.61T18 17.75v4.25H15v-2h-2v2h-2v-2h-2v2H6Z" />
    </Icon>
  );
}

export function SentimentVerySatisfiedIcon() {
  return (
    <Icon name="SentimentVerySatisfiedIcon">
      <circle cx="15.5" cy="9.5" r="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m-5-6c.78 2.34 2.72 4 5 4s4.22-1.66 5-4z" />
    </Icon>
  );
}

export function CheckCircleIcon() {
  return (
    <Icon name="CheckCircleIcon">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z" />
    </Icon>
  );
}

export function CloseRoundedIcon() {
  return (
    <Icon name="CloseRoundedIcon">
      <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7a.996.996 0 0 0-1.41 0c-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0L12 13.41l4.89 4.89c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4" />
    </Icon>
  );
}

export function ReportIcon() {
  return (
    <Icon name="ReportIcon">
      <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27zM12 17.3c-.72 0-1.3-.58-1.3-1.3s.58-1.3 1.3-1.3 1.3.58 1.3 1.3-.58 1.3-1.3 1.3m1-4.3h-2V7h2z" />
    </Icon>
  );
}

export function WarningIcon() {
  return (
    <Icon name="WarningIcon">
      <path d="M1 21h22L12 2zm12-3h-2v-2h2zm0-4h-2v-4h2z" />
    </Icon>
  );
}

export function GitHubIcon() {
  return (
    <Icon name="GitHubIcon">
      <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27" />
    </Icon>
  );
}
