import React from "react";

export default function Button({
  children,
  onClick,
  variant = "primary", // primary | secondary | ghost
  size = "md",        // sm | md | lg
  type = "button",
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-medium transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 " +
    "disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-[1px]";

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };

  const variants = {
    primary:
      // hoher Kontrast in light & dark
      "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 " +
      "shadow ring-1 ring-emerald-700/30 dark:ring-emerald-900/30",
    secondary:
      "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 " +
      "shadow ring-1 ring-black/10 dark:ring-white/5",
    ghost:
      "bg-transparent text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800 " +
      "ring-1 ring-zinc-200 dark:ring-zinc-700",
  };

  return (
    <button type={type} onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {children}
    </button>
  );
}
