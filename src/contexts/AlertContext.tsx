import React, { createContext, useContext, ReactNode, useState } from 'react';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  timeout?: number; // in milliseconds, undefined means it won't auto-dismiss
}

interface AlertContextType {
  alerts: Alert[];
  showAlert: (type: AlertType, message: string, timeout?: number) => string;
  dismissAlert: (id: string) => void;
  dismissAllAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Show an alert and return its ID
  const showAlert = (type: AlertType, message: string, timeout = 5000): string => {
    const id = Date.now().toString();
    const newAlert: Alert = { id, type, message, timeout };
    
    setAlerts(prevAlerts => [...prevAlerts, newAlert]);
    
    if (timeout) {
      setTimeout(() => {
        dismissAlert(id);
      }, timeout);
    }
    
    return id;
  };

  // Dismiss a specific alert by ID
  const dismissAlert = (id: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
  };

  // Dismiss all alerts
  const dismissAllAlerts = () => {
    setAlerts([]);
  };

  return (
    <AlertContext.Provider value={{ alerts, showAlert, dismissAlert, dismissAllAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
