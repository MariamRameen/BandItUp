import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; className?: string };

const Input: React.FC<Props> = ({ label, className = "", ...props }) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <input
      {...props}
      className={`w-full bg-[#f3f3f5] dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7D3CFF] ${className}`}
    />
  </div>
);

export default Input;
