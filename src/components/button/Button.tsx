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
  disabled = false,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  color?: ButtonColor;
  variant?: "solid" | "soft";
  size?: "md" | "sm";
  iconOnly?: boolean;
  disabled?: boolean;
  className?: string;
  /** The accessible name. Required of a button whose content is an icon alone. */
  ariaLabel?: string;
}) {
  const modifiers = getClasses({
    [`--${variant}`]: true,
    [`--${color}`]: true,
    "--sm": size === "sm",
    "--icon": iconOnly,
  });
  return (
    <BaseButton
      type="button"
      aria-label={ariaLabel}
      className={`button ${modifiers} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </BaseButton>
  );
}
