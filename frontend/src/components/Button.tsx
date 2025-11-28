import React from "react";

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }> = ({
  children,
  variant = "primary",
  ...props
}) => {
  if (variant === "ghost") {
    return (
      <button {...props} className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-accent transition">
        {children}
      </button>
    );
  }
  return (
    <button
      {...props}
      className="w-full bg-gradient-to-r from-gradientFrom to-gradientTo text-white py-3 rounded-xl font-semibold shadow-md hover:opacity-95 transition"
    >
      {children}
    </button>
  );
};

export default Button;
