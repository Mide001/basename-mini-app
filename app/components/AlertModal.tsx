import React from "react";
import { X, Share2 } from "lucide-react";


const AlertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  message: string;
  success: boolean;
  onShare: () => void;
}> = ({ isOpen, onClose, message, success, onShare }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 relative z-10 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium">{success ? "Success" : "Error"}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={`w-16 h-16 mx-auto mt-6 flex items-center justify-center rounded-full ${
            success ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {success ? (
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>


        <div className="text-center px-6 py-4">
          <p
            className={`text-sm ${success ? "text-green-800" : "text-red-800"}`}
          >
            {message}
          </p>
        </div>


        <div className="flex border-t p-4">
          {success ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 mx-1 py-2 px-4 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onShare}
                className="flex-1 mx-1 py-2 px-4 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <Share2 size={16} className="mr-1" />
                Share
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
