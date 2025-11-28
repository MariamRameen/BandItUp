import React from "react";

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-md border border-[#ececf0] ${className}`}>{children}</div>
);

export default Card;
