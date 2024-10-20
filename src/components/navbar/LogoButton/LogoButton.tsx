import Button from "@mui/joy/Button";
import "./LogoButton.scss";

export default function LogoButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="solid" color="primary" onClick={onClick}>
      <img className="logo" src="/logo192.png" />
    </Button>
  );
}
