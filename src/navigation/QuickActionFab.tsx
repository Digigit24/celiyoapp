import React, { useMemo, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../components/ui";
import { filterQuickActions, type QuickAction } from "../constants/modules";
import { actionFeedback, tapFeedback } from "../lib/haptics";
import { useAuth } from "../store/AuthContext";

const SPRING = { damping: 16, stiffness: 200, mass: 0.5 } as const;
const FAB_SIZE = 56;
/**
 * How much of the FAB's own height sits below the bar's top border (i.e. how
 * far it's pulled down into the bar). 70% of FAB_SIZE keeps most of the
 * circle nested into the bar with only a small cap peeking above the line.
 */
const FAB_LIFT = Math.round(FAB_SIZE * 0.7);
const CHIP_GAP = 56;
const STAGGER_MS = 55;

/**
 * Centre action button. Tapping it rotates the plus into a close icon while the
 * permitted quick actions stagger upward over a dimmed backdrop.
 */
export function QuickActionFab({ bottomOffset }: { bottomOffset: number }) {
  const { session } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const actions = useMemo(
    () => filterQuickActions(session?.permissions, session?.isSuperAdmin),
    [session?.permissions, session?.isSuperAdmin]
  );

  const progress = useDerivedValue(
    () => withSpring(open ? 1 : 0, SPRING),
    [open]
  );

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed ? 0.9 : 1, SPRING) },
      { rotate: `${progress.value * 45}deg` },
    ],
  }), [pressed]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(open ? 1 : 0, { duration: 180 }),
  }), [open]);

  if (actions.length === 0) return null;

  const toggle = () => {
    actionFeedback();
    setOpen((v) => !v);
  };

  const run = (action: QuickAction) => {
    tapFeedback();
    setOpen(false);
    // Screens land in a later phase — acknowledge the tap for now.
    toast.show(`${action.label} — coming soon`, "info");
  };

  return (
    <>
      {open ? (
        <Animated.View
          // Anchored to the bar's top edge and grown upward to cover the
          // screen; `height` alone (no `top`) keeps the constraints unambiguous.
          className="absolute left-0 right-0 bg-foreground/40"
          style={[{ bottom: 0, height: screenHeight * 1.5 }, backdropStyle]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close quick actions"
            className="flex-1"
            onPress={toggle}
          />
        </Animated.View>
      ) : null}

      {actions.map((action, i) => (
        <ActionChip
          key={action.id}
          action={action}
          index={i}
          total={actions.length}
          open={open}
          bottomOffset={bottomOffset}
          onPress={() => run(action)}
        />
      ))}

      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 items-center"
        style={{ bottom: bottomOffset - FAB_LIFT }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? "Close quick actions" : "Quick actions"}
          accessibilityState={{ expanded: open }}
          onPress={toggle}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
        >
          <Animated.View
            className="items-center justify-center rounded-full bg-primary"
            style={[
              {
                height: FAB_SIZE,
                width: FAB_SIZE,
                shadowColor: "#2563eb",
                shadowOpacity: 0.45,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 12,
              },
              fabStyle,
            ]}
          >
            <Ionicons name="add" size={30} color="#ffffff" />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

interface ActionChipProps {
  action: QuickAction;
  index: number;
  total: number;
  open: boolean;
  bottomOffset: number;
  onPress: () => void;
}

function ActionChip({
  action,
  index,
  total,
  open,
  bottomOffset,
  onPress,
}: ActionChipProps) {
  const [pressed, setPressed] = useState(false);

  // Chips nearest the FAB lead on open and trail on close.
  const openDelay = index * STAGGER_MS;
  const closeDelay = (total - 1 - index) * (STAGGER_MS - 20);

  const style = useAnimatedStyle(() => {
    const delay = open ? openDelay : Math.max(closeDelay, 0);
    return {
      opacity: withDelay(delay, withTiming(open ? 1 : 0, { duration: 170 })),
      transform: [
        {
          translateY: withDelay(
            delay,
            withSpring(open ? -(index + 1) * CHIP_GAP : 0, SPRING)
          ),
        },
        { scale: withDelay(delay, withSpring(open ? 1 : 0.8, SPRING)) },
      ],
    };
  }, [open, openDelay, closeDelay, index]);

  return (
    <Animated.View
      pointerEvents={open ? "box-none" : "none"}
      className="absolute left-0 right-0 items-center"
      style={[{ bottom: bottomOffset - FAB_LIFT + 4 }, style]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        className="flex-row items-center gap-2.5 rounded-full bg-card pl-2 pr-4 py-2"
        style={{
          opacity: pressed ? 0.85 : 1,
          shadowColor: "#0f172a",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${action.color}1f` }}
        >
          <Ionicons name={action.icon as never} size={17} color={action.color} />
        </View>
        <Text className="text-sm font-semibold text-card-foreground">
          {action.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
