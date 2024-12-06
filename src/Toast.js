import React, { useState, useEffect, createContext, useContext } from "react";

// Create Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = Date.now(); // Unique ID for each toast
    setToasts((prevToasts) => [...prevToasts, { id, type, message }]);
    setTimeout(() => removeToast(id), 3000); // Remove after 3 seconds
  };

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} type={toast.type} message={toast.message} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Toast Component
const Toast = ({ type, message }) => {
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-black",
  };

  return (
    <div
      className={`w-full max-w-xs px-4 py-2 rounded shadow-lg ${typeClasses[type]} animate-slide-up`}
    >
      {message}
    </div>
  );
};

// Hook to use Toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.addToast;
};

// CSS for Toast Animation
const toastStyles = `
@keyframes slide-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-up {
  animation: slide-up 0.5s ease-out;
}
`;

// Inject styles dynamically
const styleElement = document.createElement("style");
styleElement.textContent = toastStyles;
document.head.appendChild(styleElement);