"use client";
import React from "react";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { value?: any };

export default function FormSelect({ value, className = "", children, ...props }: Props) {
  const hasValue = typeof value === "string" ? value !== "" : value != null;
  const colorCls = hasValue ? "text-gray-800" : "text-gray-600";
  return (
    <select {...props} value={value} className={`${className} ${colorCls}`}>
      {children}
    </select>
  );
}
