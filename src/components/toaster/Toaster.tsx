import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoIcon from "@mui/icons-material/Info";
import ReportIcon from "@mui/icons-material/Report";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "../button/Button";
import { Toast, useToastActions, useToasts } from "../../context/ToastContext";
import "./Toaster.scss";

function startIconFor(type: Toast["type"]) {
  if (type === "success") {
    return <CheckCircleIcon />;
  }
  if (type === "danger") {
    return <ReportIcon />;
  }
  if (type === "warning") {
    return <WarningIcon />;
  }
  return <InfoIcon />;
}

export default function Toaster() {
  const toasts = useToasts();
  const { removeToast } = useToastActions();

  return (
    <div className="toaster">
      {toasts.map((toast: Toast) => {
        return (
          <div key={toast.id} className={`toast --${toast.type}`} role="alert">
            <span className="toast__icon">{startIconFor(toast.type)}</span>
            <div className="toast__body">
              <div className="toast__header">{toast.header}</div>
              <div className="toast__message">{toast.message}</div>
            </div>
            <Button
              variant="soft"
              size="sm"
              iconOnly
              className="toast__close"
              onClick={() => removeToast(toast)}
            >
              <CloseRoundedIcon />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
