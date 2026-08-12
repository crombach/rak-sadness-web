import { Button as BaseButton } from "@base-ui-components/react/button";
import { ReactNode } from "react";
import getClasses from "../../utils/getClasses";
import "./Button.scss";

export type ButtonColor = "primary" | "success" | "danger";

export default function Button({
  children,
  onClick,
  color = "primary",
  variant = "solid",
  size = "md",
  iconOnly = false,
  compact = false,
  disabled = false,
  ariaDisabled = false,
  busy = false,
  selected,
  className = "",
  ariaLabel,
  ariaExpanded,
  ariaControls,
}: {
  children: ReactNode;
  onClick: () => void;
  color?: ButtonColor;
  variant?: "solid" | "soft";
  size?: "lg" | "md" | "sm";
  iconOnly?: boolean;
  /** Tighter side padding, for a bar that has more buttons than room. */
  compact?: boolean;
  disabled?: boolean;
  /**
   * Unavailable for now rather than unavailable outright. Keeps the button in the
   * tab order and looking like itself, which `disabled` does neither of, for a
   * control that is only waiting on something.
   */
  ariaDisabled?: boolean;
  /** Set while the button's own work is running. Draws the shared loading sheen. */
  busy?: boolean;
  /** Set where the button is one of a set and shows which one is chosen. */
  selected?: boolean;
  className?: string;
  /** The accessible name. Required of a button whose content is an icon alone. */
  ariaLabel?: string;
  /** Set where the button opens and closes something below it. */
  ariaExpanded?: boolean;
  /** The id of what `ariaExpanded` opens. */
  ariaControls?: string;
}) {
  const modifiers = getClasses({
    [`--${variant}`]: true,
    [`--${color}`]: true,
    "--sm": size === "sm",
    "--lg": size === "lg",
    "--icon": iconOnly,
    "--compact": compact,
    "--selected": !!selected,
    "--busy": busy,
  });
  return (
    <BaseButton
      type="button"
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-pressed={selected}
      aria-disabled={ariaDisabled || undefined}
      aria-busy={busy || undefined}
      className={`button ${modifiers} ${className}`}
      disabled={disabled}
      onClick={ariaDisabled ? () => {} : onClick}
    >
      {children}
    </BaseButton>
  );
}
