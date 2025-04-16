import React from 'react';
import { useAlert } from '../../contexts/AlertContext';
import Alert from './Alert';

const AlertContainer: React.FC = () => {
  const { alerts, dismissAlert } = useAlert();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      {alerts.map(alert => (
        <Alert key={alert.id} alert={alert} onDismiss={dismissAlert} />
      ))}
    </div>
  );
};

export default AlertContainer;
