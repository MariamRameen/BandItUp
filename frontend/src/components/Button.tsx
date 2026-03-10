import React from "react";

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost"; className?: string }> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  if (variant === "ghost") {
    return (
      <button {...props} className={`px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${className}`}>
        {children}
      </button>
    );
  }
  return (
    <button
      {...props}
      className={`w-full bg-gradient-to-r from-[#7D3CFF] to-[#6B2FE6] text-white py-3 rounded-xl font-semibold shadow-md hover:opacity-95 transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
