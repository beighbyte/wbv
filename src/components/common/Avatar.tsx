import React from "react";
import { getInitials } from "@/lib/utils/colors";

interface AvatarProps {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  color = "#008069",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-sm font-semibold",
    lg: "w-16 h-16 text-lg font-bold",
  }[size];

  const initials = getInitials(name);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white shrink-0 shadow-sm select-none transition-transform ${sizeClasses} ${className}`}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      <span>{initials}</span>
    </div>
  );
};

