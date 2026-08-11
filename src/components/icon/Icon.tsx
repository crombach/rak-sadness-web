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

export function SentimentVeryDissatisfiedIcon() {
  return (
    <Icon name="SentimentVeryDissatisfiedIcon">
      <circle cx="15.5" cy="9.5" r="1.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-6c-2.33 0-4.32 1.45-5.12 3.5h1.67c.69-1.19 1.97-2 3.45-2s2.75.81 3.45 2h1.67c-.8-2.05-2.79-3.5-5.12-3.5" />
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
