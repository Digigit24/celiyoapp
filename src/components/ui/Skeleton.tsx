import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface SkeletonProps {
  className?: string;
}

/** Pulsing placeholder block, e.g. <Skeleton className="h-4 w-2/3 rounded" /> */
export function Skeleton({ className }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={["bg-muted rounded", className ?? ""].join(" ")}
      style={{ opacity }}
    />
  );
}

/** Ready-made list-placeholder: n avatar+two-line rows. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <View className="gap-1 px-4 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className="flex-row items-center gap-3 py-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </View>
        </View>
      ))}
    </View>
  );
}
