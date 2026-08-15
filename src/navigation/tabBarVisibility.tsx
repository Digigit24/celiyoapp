import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

interface TabBarVisibilityValue {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityValue>({
  hidden: false,
  setHidden: () => {},
});

export function TabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo(() => ({ hidden, setHidden }), [hidden]);
  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility(): TabBarVisibilityValue {
  return useContext(TabBarVisibilityContext);
}

/** Distance the user must travel in one direction before the bar reacts. */
const THRESHOLD = 12;

/**
 * Spread onto any ScrollView/FlatList to get hide-on-scroll-down,
 * show-on-scroll-up. Long tables then get the full screen height.
 *
 *   const scroll = useTabBarScrollHandler();
 *   <FlatList {...scroll} />
 */
export function useTabBarScrollHandler() {
  const { setHidden } = useTabBarVisibility();
  const lastY = useRef(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const delta = y - lastY.current;

      // Ignore rubber-banding at the very top.
      if (y <= 0) {
        setHidden(false);
        lastY.current = y;
        return;
      }
      if (Math.abs(delta) < THRESHOLD) return;

      setHidden(delta > 0);
      lastY.current = y;
    },
    [setHidden]
  );

  return { onScroll, scrollEventThrottle: 16 } as const;
}
