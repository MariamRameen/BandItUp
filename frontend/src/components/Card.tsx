import React from "react";

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-[#F0E8FF] dark:border-gray-700 ${className}`}>{children}</div>
);

export default Card;
