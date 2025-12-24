import type { ReactNode } from "react";

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?:
    | "primary"
    | "danger"
    | "warning"
    | "other"
    | "default"
    | "secondary";
  children: ReactNode;
  minimize?: boolean;
  icon?: ReactNode;
}

const getVariantClasses = (variant: ButtonProps["variant"]) => {
  switch (variant) {
    case "danger":
      return "bg-red-600 hover:bg-red-700";
    case "warning":
      return "bg-orange-500 hover:bg-orange-600";
    case "other":
      return "bg-blue-500 hover:bg-blue-600";
    case "default":
      return "bg-blue-600 hover:bg-blue-700";
    case "secondary":
      return "bg-gray-600 hover:bg-gray-700";
    default:
      return "bg-green-600 hover:bg-green-700";
  }
};

export const Button = ({
  onClick,
  disabled = false,
  variant = "primary",
  children,
  minimize = false,
  icon,
}: ButtonProps) => {
  const baseClasses =
    "text-white border-none rounded flex items-center justify-center";
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = minimize ? "p-2 w-9 h-9" : "py-2 px-4";
  const gapClasses = minimize ? "" : "gap-2";
  const stateClasses = disabled
    ? "opacity-70 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${gapClasses} ${stateClasses}`}
    >
      {minimize ? icon : children}
    </button>
  );
};
