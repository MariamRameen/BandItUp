import React from "react";

export default function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      className="w-full bg-[#f3f3f5] px-4 py-3 rounded-lg border border-gray-200 text-center text-xl tracking-widest"
      placeholder="______"
    />
  );
}
