import { Button as BaseButton } from "@base-ui-components/react/button";
import { ReactNode, Ref } from "react";
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
  buttonRef,
}: {
  children: ReactNode;
  onClick: () => void;
  color?: ButtonColor;
  variant?: "solid" | "soft";
  size?: "md" | "sm";
  iconOnly?: boolean;
  disabled?: boolean;
  className?: string;
  buttonRef?: Ref<HTMLElement>;
}) {
  const modifiers = getClasses({
    [`--${variant}`]: true,
    [`--${color}`]: true,
    "--sm": size === "sm",
    "--icon": iconOnly,
  });
  return (
    <BaseButton
      ref={buttonRef}
      type="button"
      className={`button ${modifiers} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </BaseButton>
  );
}
