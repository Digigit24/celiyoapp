# DESIGN.md — Celiyo Mobile Design Tokens

This is the single source of truth for visual decisions in the mobile app.
Every screen must consume tokens from this file; nothing is hard-coded.

The file mirrors `celiyohms/docs/DESIGN.md` (web) so design parity is
maintainable across platforms. When you change a token here, change it
on the web too (and vice versa) — they're the same design system.

---

## 1. Spacing scale

Use these increments only. No magic numbers like 7, 9, 13, 17, etc.

| Class          | px   | Use                                        |
|----------------|------|--------------------------------------------|
| `gap-0.5`      | 2    | Hairline pairing inside a control          |
| `gap-1`        | 3.5  | Icon + label in compact rows               |
| `gap-1.5`      | 5    | Tight stack                               |
| `gap-2`        | 7    | Default row gap inside cards              |
| `gap-2.5`      | 9    |                                            |
| `gap-3`        | 10.5 | Default stack gap between sections        |
| `gap-4`        | 14   | Card padding                              |
| `gap-5`        | 17.5 |                                            |
| `gap-6`        | 21   | Section separators                        |
| `gap-8`        | 28   | Page padding (top/bottom)                 |

**Containers:**
- Screen horizontal padding: `px-4` (14px each side)
- Card inner padding: `p-4`
- Card inner padding (compact): `p-3`
- Bottom safe area: `TAB_BAR_CONTENT_INSET` (62px) + actual insets.bottom + 24

## 2. Typography

Six roles. Don't invent new font sizes.

| Role            | Class                          | px  | weight  | Use                              |
|-----------------|--------------------------------|-----|---------|----------------------------------|
| Display         | `text-2xl font-bold`           | 21  | 700     | Hero numbers (KPI tile big stat) |
| Heading 1       | `text-[22px] font-bold`        | 22  | 700     | Greeting, screen title           |
| Heading 2       | `text-base font-semibold`      | 14  | 600     | Section heading inside a screen  |
| Heading 3       | `text-sm font-semibold`        | 12.25 | 600  | Card title                       |
| Body            | `text-sm` / `text-base`        | 12.25 / 14 | 400 | Body text                        |
| Caption         | `text-xs text-muted-foreground`| 10.5 | 400   | Timestamps, hints                |
| Eyebrow         | `text-[11px] font-bold uppercase tracking-wider text-muted-foreground` | 11 | 700 | Section labels in drawer / empty state |

Line-heights:
- Headings: default (`leading-none` for the biggest)
- Body: `leading-relaxed` (1.625) for paragraphs; default for lists

## 3. Colour

Tokens are CSS variables defined in `global.css`. NativeWind reads them via
`var(--X)` in `tailwind.config.js`. Native dark mode flips them via
`@media (prefers-color-scheme: dark) { :root { … } }` — see the
`react-native-ui-patterns` skill for why class-based dark mode is dead on native.

### Surfaces (always pick from these — never use raw Tailwind 50-shades for surfaces)

| Token              | Light     | Dark      | Use                          |
|--------------------|-----------|-----------|------------------------------|
| `background`       | `#ffffff` | `#0f172a` | Screen background            |
| `surface`          | `#f8fafc` | `#1e293b` | Grouped content background   |
| `card`             | `#ffffff` | `#0f172a` | Card surface                 |
| `muted`            | `#f1f5f9` | `#1e293b` | Subdued background, inactive |
| `accent`           | `#f1f5f9` | `#1e293b` | Press state                  |
| `border` / `input` | `#e2e8f0` | `#1e293b` | Hairline separators          |

### Foreground

| Token                  | Light     | Dark      | Use                  |
|------------------------|-----------|-----------|----------------------|
| `foreground`           | `#0f172a` | `#f8fafc` | Primary text         |
| `foreground-secondary` | `#475569` | `#cbd5e1` | Less important text  |
| `muted-foreground`     | `#64748b` | `#94a3b8` | Hints, captions      |
| `card-foreground`      | `#0f172a` | `#f8fafc` | Text *on* `bg-card`  |

### Brand

| Token            | Light   | Dark    | Use                        |
|------------------|---------|---------|----------------------------|
| `primary`        | `#2563eb` | `#3b82f6` | Brand blue, primary CTA   |
| `primary-foreground` | `#ffffff` | `#0f172a` | Text on primary           |
| `destructive`    | `#ef4444` | `#7c1d1d` | Errors, sign-out          |
| `destructive-foreground` | `#ffffff` | `#f8fafc` | Text on destructive |

### Accent palette (for chips, stat tiles, category icons)

These never change between light/dark — they're semantic indicators.

| Family   | Tint     | Strong  | On-tint text |
|----------|----------|---------|--------------|
| emerald  | `#d1fae5` | `#059669` | `#047857` |
| amber    | `#fef3c7` | `#f59e0b` | `#92400e` |
| rose     | `#ffe4e6` | `#e11d48` | `#9f1239` |
| blue     | `#eff6ff` | `#2563eb` | `#1e40af` |
| slate    | `#f1f5f9` | `#475569` | `#0f172a` |

Use the tint (50/100 shade) for backgrounds, strong (600) for the icon or
text on white, dark (700/800) for the actual text. Example:
`<View bg-emerald-50><Ionicons color-emerald-600 /><Text color-emerald-700 />`

## 4. Elevation

Three levels. Never hand-write shadow styles.

| Level | Use                              | Implementation                       |
|-------|----------------------------------|--------------------------------------|
| 0     | Default                          | no shadow                            |
| 1     | Cards, pills                     | `shadow-sm shadow-black/5`           |
| 2     | Bottom sheets, modals, FAB       | `shadow-lg shadow-black/10`           |
| 3     | Toasts, drag handles             | `shadow-lg shadow-black/20`          |

## 5. Radius

| Token      | Class       | px  | Use                            |
|------------|-------------|-----|--------------------------------|
| sharp      | `rounded`   | 4   | Inline pills, toggles          |
| `sm`       | `rounded`   | 4   | (alias)                        |
| `md`       | `rounded-md`| 6   | Inputs, buttons                |
| `lg`       | `rounded-lg`| 8   | Cards in dense layouts         |
| `xl`       | `rounded-xl`| 11  | Default card                   |
| `2xl`      | `rounded-2xl` | 14 | Hero card, identity card       |
| `3xl`      | `rounded-3xl` | 18 | Sheets, modal panels           |
| full       | `rounded-full` | 9999 | Avatars, chips, FAB          |

## 6. Iconography

- `@expo/vector-icons` Ionicons — only icon family in use
- Active state: filled variant (`people` vs `people-outline`)
- Default size: 22 (tab bar), 20 (drawer rows), 18 (list items), 14 (chips)
- Icon-only buttons get `h-11 w-11` (44pt touch target)
- Never use multiple icon families on one screen

## 7. Motion

| Token        | Spec                                              | Use                   |
|--------------|---------------------------------------------------|-----------------------|
| `SPRING`     | `{ damping: 18, stiffness: 190, mass: 0.55 }`     | Anything physical     |
| `DURATION_FAST` | `withTiming(120)`                              | Press feedback        |
| `DURATION_BASE` | `withTiming(160)`                              | Colour / opacity      |
| `DURATION_SLOW` | `withTiming(240)`                              | Slide / fade          |

Haptic conventions:
- Tap on any list/tab → `Haptics.impactAsync(Light)`
- Tab change in bottom bar → `Haptics.selectionAsync()`
- Open bottom sheet / FAB → `Haptics.impactAsync(Medium)`
- Destructive (sign out, delete) → `Haptics.notificationAsync(Warning)`

Reanimated rules — see `react-native-ui-patterns` skill, but the short
version: **never call a JS closure from `useAnimatedStyle`**. Worklets may
only close over primitives, arrays/objects of primitives, and shared values.

## 8. Density

`compact` is the default. `default` adds 4px padding everywhere. `spacious`
adds 8px. The theme config will eventually expose this; for now, leave it at
compact and only change per-screen with explicit spacing overrides.

## 9. Don't

- Don't use raw `#XXXXXX` hex anywhere outside `src/theme/colors.ts` and `global.css`.
- Don't use `bg-white`, `bg-black`, or `bg-transparent` — use `bg-card`, `bg-foreground`, `bg-background/0`.
- Don't add `gap` *and* `space-y` together — RN has no `space-y`; gap is the only option.
- Don't add inline `style={{ color: "#..." }}` — there must be a token for it.
- Don't use `flex: 1` *and* `flex-1` together in the same row — pick one (the class).
- Don't animate layout properties (`width`, `height`, `top`, `margin`) — animate `transform` only.
- Don't write `shadow*` inline unless an animation requires it; use elevation levels.
- Don't use Tailwind 50-shades for surfaces — surfaces always come from tokens.
- Don't put a `Pressable` inside a `Pressable`.
- Don't nest `ScrollView` inside `ScrollView`.
- Don't render an empty `<EmptyState>` placeholder inside a list — use `ListEmptyComponent`.