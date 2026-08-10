import {
  PropsWithChildren,
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";

export const MAX_VISIBLE_TOASTS = 3;
export const TOAST_LIFETIME_MS = 5000;

/** Each value has a matching soft fill token in `index.scss`. */
export type ToastType =
  "primary" | "neutral" | "success" | "warning" | "danger";

export class Toast {
  id: string;
  type: ToastType;
  header: string;
  message: string | ReactElement;

  constructor(type: ToastType, header: string, message: string | ReactElement) {
    this.id = uuidv4();
    this.type = type;
    this.header = header;
    this.message = message;
  }
}

type ToastActions = {
  showToast: (toast: Toast) => void;
  removeToast: (toast: Toast) => void;
  clearToasts: () => void;
};

// The actions sit in their own context because their identity never changes. That
// keeps the parts of the app that only send toasts (every player cell, for one)
// still while toasts appear and time out.
const ToastActionsContext = createContext<ToastActions>({
  showToast: () => {
    /* Placeholder */
  },
  removeToast: () => {
    /* Placeholder */
  },
  clearToasts: () => {
    /* Placeholder */
  },
});

const ToastListContext = createContext<Array<Toast>>([]);

/** For sending toasts. Does not re-render when the visible toasts change. */
export function useToastActions(): ToastActions {
  return useContext(ToastActionsContext);
}

/** For rendering toasts. `Toaster` is the only thing that needs this. */
export function useToasts(): Array<Toast> {
  return useContext(ToastListContext);
}

export function ToastContextProvider({ children }: PropsWithChildren<object>) {
  const [toasts, setToasts] = useState<Array<Toast>>([]);

  // Declared before showToast, which schedules it.
  const removeToast = useCallback((toast: Toast) => {
    setToasts((oldToasts) => oldToasts.filter((it) => it.id !== toast.id));
  }, []);

  const showToast = useCallback(
    (toast: Toast) => {
      setToasts((oldToasts) => {
        const newToasts = [...oldToasts, toast];
        return newToasts.slice(
          Math.max(newToasts.length - MAX_VISIBLE_TOASTS, 0),
        );
      });
      setTimeout(() => {
        removeToast(toast);
      }, TOAST_LIFETIME_MS);
    },
    [removeToast],
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const actions = useMemo(
    () => ({ showToast, removeToast, clearToasts }),
    [showToast, removeToast, clearToasts],
  );

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastListContext.Provider value={toasts}>
        {children}
      </ToastListContext.Provider>
    </ToastActionsContext.Provider>
  );
}
