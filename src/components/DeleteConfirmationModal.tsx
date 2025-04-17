'use client';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting?: boolean;
  progress?: {
    current: number;
    total: number;
  };
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
  progress
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 bg-red-100 rounded-full p-2 mr-3">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-500">{message}</p>
          
          {/* Progress bar for batch operations */}
          {isDeleting && progress && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {progress.current} of {progress.total} completed
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isDeleting ? (progress ? `Deleting... (${progress.current}/${progress.total})` : 'Deleting...') : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
