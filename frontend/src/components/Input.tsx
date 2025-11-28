import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };

const Input: React.FC<Props> = ({ label, ...props }) => (
  <div className="flex flex-col space-y-1">
    {label && <label className="text-sm font-medium text-[var(--srs-foreground)]">{label}</label>}
    <input
      {...props}
      className="w-full bg-[#f3f3f5] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gradientFrom"
    />
  </div>
);

export default Input;
