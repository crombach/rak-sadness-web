import { ColorPaletteProp } from "@mui/joy";
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

export class Toast {
  id: string;
  type: ColorPaletteProp;
  header: string;
  message: string | ReactElement;

  constructor(
    type: ColorPaletteProp,
    header: string,
    message: string | ReactElement,
  ) {
    this.id = uuidv4();
    this.type = type;
    this.header = header;
    this.message = message;
  }
}

type ToastContextData = {
  toasts: Array<Toast>;
  showToast: (toast: Toast) => void;
  removeToast: (toast: Toast) => void;
  clearToasts: () => void;
};

const ToastContext = createContext<ToastContextData>({
  toasts: [],
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

function useToastContextData(): ToastContextData {
  const [toasts, setToasts] = useState<Array<Toast>>([]);

  const showToast = useCallback(
    (toast: Toast) => {
      // Limit to 3 toasts.
      setToasts((oldToasts) => {
        const newToasts = [...oldToasts, toast];
        return newToasts.slice(Math.max(newToasts.length - 3, 0));
      });
      // Remove the toast after 5 seconds.
      setTimeout(() => {
        removeToast(toast);
      }, 5000);
    },
    [toasts],
  );

  const removeToast = useCallback(
    (toast: Toast) => {
      setToasts((oldToasts) => oldToasts.filter((it) => it.id !== toast.id));
    },
    [toasts],
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextData = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
      clearToasts,
    }),
    [toasts],
  );

  return contextData;
}

export function useToastContext() {
  return useContext(ToastContext);
}

export function ToastContextProvider({ children }: PropsWithChildren<object>) {
  const value = useToastContextData();
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
