import React from "react";
import { Text, View } from "react-native";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeStyles: Record<
  Size,
  { box: string; text: string }
> = {
  xs: { box: "h-6 w-6", text: "text-[10px]" },
  sm: { box: "h-8 w-8", text: "text-xs" },
  md: { box: "h-10 w-10", text: "text-sm" },
  lg: { box: "h-12 w-12", text: "text-base" },
  xl: { box: "h-16 w-16", text: "text-lg" },
};

const colourPalettes = [
  { bg: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-50", text: "text-amber-800" },
  { bg: "bg-rose-50", text: "text-rose-700" },
  { bg: "bg-violet-50", text: "text-violet-700" },
  { bg: "bg-slate-100", text: "text-slate-700" },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

interface AvatarProps {
  /** Source of the displayed letter(s). When omitted, falls back to "?". */
  source?: string | null;
  size?: Size;
  /** Override the colour pair (background / text). */
  tint?: { bg: string; text: string };
}

/**
 * Initials avatar with a deterministic colour from the source string. Used in
 * identity cards, list rows, and any other "person / entity" surface where a
 * real image isn't available yet.
 */
export function Avatar({ source, size = "md", tint }: AvatarProps) {
  const initial =
    source && source.trim().length > 0
      ? source.trim()[0].toUpperCase()
      : "?";
  const s = sizeStyles[size];
  const palette = tint ?? colourPalettes[hash(source ?? "?") % colourPalettes.length];

  return (
    <View
      className={[
        "items-center justify-center rounded-full",
        s.box,
        palette.bg,
      ].join(" ")}
    >
      <Text
        className={["font-bold capitalize", s.text, palette.text].join(" ")}
      >
        {initial}
      </Text>
    </View>
  );
}