import Button from "@mui/joy/Button";
import "./LogoButton.scss";

export default function LogoButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="solid"
      color="primary"
      onClick={onClick}
      className="logo-button"
    >
      <img className="logo-button__logo" src="/logo192.png" />
    </Button>
  );
}
