import { createContext, useContext, useState, ReactNode } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Alert {
  show: boolean;
  message: string;
  type: AlertType;
  timeout?: number;
}

interface AlertContextType {
  alert: Alert;
  showAlert: (type: AlertType, message: string, timeout?: number) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider = ({ children }: AlertProviderProps) => {
  const [alert, setAlert] = useState<Alert>({
    show: false,
    message: '',
    type: 'info',
  });

  const showAlert = (type: AlertType, message: string, timeout = 5000) => {
    setAlert({ show: true, type, message, timeout });
  };

  const hideAlert = () => {
    setAlert({ ...alert, show: false });
  };

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
