import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Ошибка загрузки данных
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ozon-600 text-white rounded-lg hover:bg-ozon-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Повторить
          </button>
        )}
      </div>
    </div>
  );
};