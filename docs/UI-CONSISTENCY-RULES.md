# UI Consistency Rules

15 rules every screen must obey. They're not a wishlist — they're a CI-grade
contract. Phase 2 agents must produce code that satisfies them; Phase 3
polish passes enforce them.

---

## 1. Every list screen

Pattern:
```
<Screen> (View flex-1 bg-background)
  <SearchHeader />
  <FilterBar />
  <FlatList
    data={items}
    keyExtractor={item => String(item.id)}
    renderItem={...}
    ListEmptyComponent={<EmptyState />}
    ListHeaderComponent={<SectionHeader />}
    ListFooterComponent={<ListFooter />}
    contentContainerStyle={{
      paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
      paddingHorizontal: 16,
    }}
    ItemSeparatorComponent={() => <View className="h-2" />}
    refreshing={refreshing}
    onRefresh={onRefresh}
  />
</Screen>
```

- **No** wrapping a `FlatList` in a `ScrollView`. Never.
- `keyExtractor` returns a string. Never use `index`.
- `ItemSeparatorComponent` returns a 2px View, never a custom line that touches row borders.
- `EmptyState` is set on the list itself (`ListEmptyComponent`), not rendered as a sibling — otherwise it shows next to populated lists.

## 2. Every detail screen

Pattern:
```
<Stack.Screen options={{ title, headerBackTitle: "Back" }} />
<ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24 }}>
  <Header />          // sticky identity card
  <QuickStats />      // 2-4 StatTiles
  <TabBar />          // TabStrip with anchors that scroll to sections
  <Section />         // each anchor target
  ...
</ScrollView>
```

- Long pages need section anchors via `TabStrip` (with `onChange={(i) => scrollToSection(i)}`).
- The header has the primary identity (avatar + name + key fields). Don't repeat the same info in body cards.
- Action buttons live in a sticky footer (`<View className="border-t bg-card" style={{paddingBottom: insets.bottom}}>`).

## 3. Every form

Pattern:
```
<Form>
  <FormField label="Patient name" required>
    <Input value={...} onChangeText={...} />
  </FormField>
  <FormField label="Date of birth" error={!!error}>
    <DateField value={...} />
  </FormField>
</Form>
```

- Labels are always above the input. No floating labels in mobile.
- Helper text (`FormField.helper`) goes below the input in `text-xs text-muted-foreground`.
- Error text replaces helper when invalid, in `text-xs text-destructive`.
- Inputs always have `h-11` (44pt) and `rounded-lg`.
- Form actions (Submit / Cancel) live in a sticky footer with `gap-2`, primary button on the right.

## 4. Every status / category indicator

Use `<Chip>`, never raw `<Badge>`. Badge is reserved for **tenant / role**
identity only.

- `<Chip variant="success">` for active states (e.g., "In session")
- `<Chip variant="warning">` for pending (e.g., "Awaiting review")
- `<Chip variant="danger">` for failed/error
- `<Chip variant="info">` for informational
- `<Chip variant="neutral">` for "Soon" placeholders
- Chip icon goes on the left, label on the right, both vertically centered
- Chip background uses the family tint (`bg-emerald-50` for success), text uses the dark variant (`text-emerald-700`)

## 5. Every async load

- **<300ms**: no loading state, render directly.
- **300ms–1s**: render `Skeleton` matching the final shape exactly.
- **>1s**: `Skeleton` + subtle "Loading…" caption (optional).
- **Error**: `<EmptyState icon="alert-circle-outline" title="Couldn't load" message="…" action={<Button onPress={retry}>Retry</Button>} />`
- **Empty (0 results)**: `<EmptyState icon="search-outline" title="No results" message="Try a different search." />`

**Never** show "Loading…" text on its own. **Never** show a spinner inside a card body without a skeleton sibling.

## 6. Every modal / bottom sheet

- Bottom sheets (`<BottomSheet>`) for **action sheets, filters, and quick forms**.
- Full-screen modals (`presentation: "modal"` on a Stack.Screen) for **focused flows** that need their own back stack.
- Bottom sheets close on:
  - Backdrop tap (no tap-through to underlying screen)
  - Drag-down past 30% of height (native gesture)
  - Android back button (`BackHandler` + the gesture-handler `useBottomSheet` callbacks)
  - Explicit close button if present
- Backdrop is `bg-foreground/40` (40% opaque black/dark).
- Sheet content max height: 80% of screen. If it would exceed, scroll the content.

## 7. Every pressable

- Touch target ≥ 44pt height. `h-11` minimum.
- Always provide `accessibilityRole` and `accessibilityLabel`.
- Press feedback:
  - Default: `active:opacity-70` OR `active:bg-accent` (the lighter of the two)
  - For list items: `active:bg-accent`
  - For cards: `active:opacity-90`
- Disabled state: `opacity-50` and `pointer-events-none` (not just `disabled` — RN's `disabled` doesn't always prevent hit-testing).
- Don't nest `Pressable` inside `Pressable`.

## 8. Every long-form text

- Lists and tables: `numberOfLines={1}` on title, `numberOfLines={2}` on subtitle.
- Long paragraphs: `Text` with no numberOfLines (let it wrap).
- IDs and codes: `<Text className="font-mono text-xs text-muted-foreground">`
- Never truncate with ellipsis on body copy — let it wrap or use `numberOfLines` deliberately.
- Don't `flex: 1` a Text inside a row and not give it a `numberOfLines` — it will cause layout shifts when content arrives.

## 9. Every FAB / floating action

- One FAB per screen, max. If a screen has more than 4 actions, use a `<BottomSheet>` with a list of options instead.
- FAB size: 56pt. Elevated 16pt above the bottom edge (above the tab bar).
- Primary FAB colour: `bg-primary`, icon white.
- FAB label is hidden by default — show on long-press as a tooltip, not a permanent caption.

## 10. Every screen with a header

- Header title comes from `Stack.Screen options={{ title }}` or `Drawer.Screen options={...}`. Never set the title via in-screen `<Text>`.
- Header tint (`headerTintColor`) follows `useTheme()` — light = `#0f172a`, dark = `#f8fafc`.
- Header background (`headerStyle.backgroundColor`) follows `useTheme()` — light = `#ffffff`, dark = `#0f172a`.
- Header right action: max one (usually a filter / settings icon). Use `<Pressable hitSlop={10}>` so 44pt hit target is real.

## 11. Every scrollable area

- Bottom padding accounts for the floating tab bar: `paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24`.
- Top padding on the first screen view: `pt-6` (21px) for breathing room.
- Use `keyboardShouldPersistTaps="handled"` for screens with text inputs.
- `showsVerticalScrollIndicator={false}` everywhere. Vertical scrollbars are noise.

## 12. Every screen uses the theme

- Read theme via `useTheme()` from `src/theme/ThemeProvider`. Never via `useColorScheme` from nativewind directly.
- Hard-coded colours (`#XXXXXX`) are only allowed inside `src/theme/colors.ts` and `global.css`. **No exceptions.**
- StatusBar style comes from `<ThemeModeSync />` mounted once at app root — never per-screen.

## 13. Every screen has a test

- Tests use `@testing-library/react-native` (already installed).
- One test per new screen: it renders without crashing, shows the empty state when data is empty, shows the populated state when given fixtures.
- Skip extensive unit tests on view trees — those break too easily and add little value.

## 14. Every screen respects permissions

- If a module has a permission gate, the screen reads it via `useAuth().session?.permissions` and `useAuth().session?.isSuperAdmin`.
- Use the helper from `src/lib/auth/permissions.ts` (`hasPermission`).
- Never hide a permission-gated UI based on local state — let the navigation refuse to mount it (e.g., the drawer filter does this).

## 15. Every screen is a stack member

- Top-level screens are mounted in `src/navigation/AppDrawer.tsx` as `<Drawer.Screen>` entries.
- Sub-screens (detail / new / edit) are mounted inside their feature's `Stack` file (`OpdStack.tsx`, etc.).
- A screen that isn't reachable via the navigation registry is a bug — delete it or wire it up.
- No "orphan" screens. No "secret" admin screens in the codebase.