import React, { useEffect } from 'react';
import { Alert as AlertType } from '../../contexts/AlertContext';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface AlertProps {
  alert: AlertType;
  onDismiss: (id: string) => void;
}

const Alert: React.FC<AlertProps> = ({ alert, onDismiss }) => {
  useEffect(() => {
    if (alert.timeout) {
      const timer = setTimeout(() => {
        onDismiss(alert.id);
      }, alert.timeout);
      
      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  const getAlertStyles = () => {
    switch (alert.type) {
      case 'error':
        return 'bg-red-50 text-red-800 border-red-300';
      case 'success':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-300';
    }
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" aria-hidden="true" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`rounded-md border p-4 mb-4 flex items-start ${getAlertStyles()}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm">{alert.message}</p>
      </div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Alert;
