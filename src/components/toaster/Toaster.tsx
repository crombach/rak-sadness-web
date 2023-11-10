import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ReportIcon from '@mui/icons-material/Report';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Alert, IconButton, Typography } from "@mui/joy";
import React from "react";
import { Toast, useToastContext } from "../../context/ToastContext";
import "./Toaster.css";

export default function Toaster() {
    const { toasts, removeToast } = useToastContext();

    return <div className="toaster">
        {toasts.map((toast: Toast) => {
            let startIcon;
            if (toast.type === "success") {
                startIcon = <CheckCircleIcon />;
            } else if (toast.type === "danger") {
                startIcon = <ReportIcon />;
            } else if (toast.type === "warning") {
                startIcon = <WarningIcon />;
            } else {
                startIcon = <InfoIcon />;
            }

            return <Alert
                key={toast.id}
                className="toast"
                color={toast.type}
                variant="soft"
                startDecorator={startIcon}
                endDecorator={
                    <React.Fragment>
                        <IconButton
                            variant="soft"
                            size="sm"
                            color={toast.type}
                            onClick={() => removeToast(toast)}
                        >
                            <CloseRoundedIcon />
                        </IconButton>
                    </React.Fragment>
                }
            >
                <div>
                    <div>{toast.header}</div>
                    <Typography level="body-sm" color={toast.type}>
                        {toast.message}
                    </Typography>
                </div>
            </Alert>
        })}
    </div>;
}