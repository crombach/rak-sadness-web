import {
  CheckCircleIcon,
  CloseIcon,
  InfoIcon,
  ReportIcon,
  WarningIcon,
} from "../icon/Icon";
import Button from "../button/Button";
import {
  Toast,
  isPersistent,
  useToastActions,
  useToasts,
} from "../../context/ToastContext";
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
  const { removeToast, pauseToasts, resumeToasts } = useToastActions();

  return (
    // Named and present before any toast is, because a live region created in the
    // same tick as its content is one iOS VoiceOver can miss.
    <div
      className="toaster"
      role="region"
      aria-label="Notifications"
      onPointerEnter={pauseToasts}
      onPointerLeave={resumeToasts}
      onFocus={pauseToasts}
      onBlur={resumeToasts}
    >
      {toasts.map((toast: Toast) => {
        return (
          <div
            key={toast.id}
            className={`toast --${toast.type}`}
            // Only a failure interrupts. Tapping a pick raises a toast about it,
            // and that should wait its turn rather than cut off whatever is being
            // read.
            role={isPersistent(toast) ? "alert" : "status"}
          >
            <span className="toast__icon">{startIconFor(toast.type)}</span>
            <div className="toast__body">
              <div className="toast__header">{toast.header}</div>
              <div className="toast__message">{toast.message}</div>
            </div>
            <Button
              ariaLabel="Dismiss"
              variant="soft"
              size="sm"
              iconOnly
              className="toast__close"
              onClick={() => removeToast(toast)}
            >
              <CloseIcon />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
