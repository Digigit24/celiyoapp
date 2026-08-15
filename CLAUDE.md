# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# DigiHMS Admin Mobile App (celiyoapp)

React Native (Expo, managed, TypeScript) staff/admin app for DigiHMS — a mobile
client for hospital staff (admin, doctors, nurses, receptionists, cashiers,
pharmacists, lab techs), not a patient portal.

## Backends (call directly — no BFF, no new backend)

- **Auth / JWT issuance — SuperAdmin** at `https://admin.celiyo.com`
  - `POST /api/auth/login/` `{email, password}` → `{user, tokens: {access, refresh}}`
  - `POST /api/auth/token/refresh/` `{refresh}` → `{access}` (no rotation)
  - `POST /api/auth/logout/` `{refresh_token}` (blacklist; best-effort)
  - JWT claims: `user_id, email, tenant_id, tenant_slug, tenant_name,
    is_super_admin, permissions (flat dict), enabled_modules, roles, exp`
- **HMS API of record — dghms** at `https://hms.celiyo.com/api/`
  - Header: `Authorization: Bearer <superadmin access token>`; tenant comes from
    the token (`x-tenant-id` / `x-tenant-slug` also sent, matching celiyohms).
  - Django runs `APPEND_SLASH` — the axios client normalizes trailing slashes.
  - Pagination envelope: `{success, count, next, previous, results}`.
  - Architecture contract: multi-tenant (`tenant_id` on every model), no Django
    User model (plain `user_id` UUIDs), permissions checked from the JWT payload
    — see `dghms/claude.md`.
  - Note: celiyohms's default `DIGIHMS_BASE_URL=https://api.celiyo.com` is stale
    (Cloudflare 530). The live host is `hms.celiyo.com`.
- **WhatsApp — digicrm** at `https://crm.celiyo.com/api/` (`src/lib/api/whatsapp.ts`)
  — same bearer JWT as dghms, plus per-tenant vendor credentials
  (`X-WA-Vendor-Uid`/`X-WA-Api-Token`) resolved from superadmin's
  `GET /api/tenants/me/` → `settings.whatsapp_vendor_uid`/`whatsapp_api_token`
  and cached in memory 5 min (never persisted to disk). **Security note**:
  celiyohms keeps these vendor credentials server-side in a Next.js BFF proxy
  and never exposes them to the browser; this app has no BFF ("call directly"
  above), so the mobile client resolves and attaches them itself, meaning the
  vendor API token is present in on-device network traffic for the lifetime
  of each WhatsApp-tab request. Treated as comparable-sensitivity to the JWT
  the app already holds via expo-secure-store (an internal staff app, not
  consumer-facing) — flagged here so it isn't rediscovered as a surprise.

## Reference projects (siblings, read-only)

- `../dghms` — Django REST backend of record.
- `../superadmin` — auth backend; also the source of tenant WhatsApp config.
- `../celiyohms` — Next.js web frontend; design/UX reference. Reuse its design
  tokens and UX patterns, NOT its components (shadcn/Radix/Tailwind don't run
  on RN). Permission logic was ported 1:1 from `celiyohms/src/lib/auth.ts` —
  keep `src/lib/auth/permissions.ts` in sync with it.
- `digicrm` (not present as a local sibling at time of writing) — the actual
  WhatsApp backend celiyohms talks to via its BFF proxy; contracts for
  `src/lib/api/whatsapp.ts` were derived from celiyohms's client code, not
  from reading digicrm directly. Re-verify against digicrm if it becomes
  available locally.

## Stack

Expo SDK 54 (RN 0.81, React 19.1) + TypeScript, React Navigation 7 (drawer +
native-stack), TanStack Query, NativeWind v4 + tailwindcss 3.4,
react-hook-form + zod, axios, expo-secure-store,
`@react-native-async-storage/async-storage` (EMR draft buffer),
`@react-native-community/netinfo` (autosave online/offline),
`@react-native-community/datetimepicker`, `expo-file-system` + `expo-sharing`
(print/CSV export), `expo-image-picker` (patient/guardian photos),
`react-native-webview` (print preview). Tests: jest-expo (`npm test`),
typecheck `npm run typecheck`.
Pinned to SDK 54 because that's the newest Expo Go on the Play Store (SDK 57's
Expo Go is store-approval-blocked) — revisit when stores catch up.

## Conventions established in Phase 1

- **Theme**: tokens in `global.css` CSS variables (light + `.dark`), mapped in
  `tailwind.config.js` to `var(--*)`. Mirrors `celiyohms/src/styles/globals.css`
  exactly. Runtime hex values in `src/theme/colors.ts` (navigation theme,
  icon colors). Radius base 8 (0.5rem), sm/md at 0.6x/0.8x.
- **Auth**: `src/store/AuthContext.tsx` owns the session; tokens live in
  expo-secure-store only (never AsyncStorage). Silent refresh scheduled 60s
  before `exp`; axios 401 → refresh once → retry → force logout
  (`src/lib/api/hmsClient.ts` + `src/lib/auth/authRuntime.ts`).
- **Permissions**: `getPrimaryRole` / `hasPermission` ported as-is from
  celiyohms; contract: `true | "own" | "all" | legacy "team" | legacy
  {enabled:true}`, wildcard `admin.full_access.enabled` grants `admin.*`/`hms.*`.
  Unit-tested in `src/lib/auth/permissions.test.ts` — run before changing.
- **Module gating**: `src/constants/modules.ts` mirrors celiyohms's
  `NAV_SECTIONS`; drawer hides modules the JWT doesn't allow.
- **UI primitives** (`src/components/ui/`): Button, Card, Input, Select, Badge,
  ListItem, EmptyState, Skeleton/SkeletonList, Toast/InlineError — every feature
  screen builds on these; keep them generic.
- **Master data**: read-only hooks in `src/hooks/masters.ts` (doctors,
  specialties, wards, beds, pharmacy products). Masters management is web-only.

## Scope rules (from the phase plan)

- Patient registration: mobile can register a new patient inline from New
  Visit / New Admission (`src/features/patients/components/PatientPicker.tsx`,
  matching celiyohms's `PatientIntakeStep`) — but standalone patient
  management (editing an existing patient, vitals, allergies) stays
  web-only.
- Prescription grid + investigation grid are core (Phase 2); AI draft wizard,
  batch print, body-diagram canvas are deferred past Phase 3.
- OPD and IPD share ONE dynamic clinical form renderer (web: `EmrWorkspace`),
  parameterized by `encounterType` (`opd_visit` / `ipd_admission`), `encounterId`,
  `formCode` — build once (Phase 2), reuse for IPD (Phase 3). No parallel
  IPD form system.
- Printing/PDF: request rendered documents from dghms's server-side printing app
  and hand to the OS share sheet (expo-sharing). Never generate PDFs on-device.

## Phase status

- [x] AI Assistant module — `src/features/assistant/screens/AssistantScreen.tsx`,
      wired into `AppDrawer` (no permission gate, visible to everyone). Wraps
      `@digitech/hermes-chat-native`'s `<HermesChatNative />` -- a local `file:`
      dependency on `../../assistanceu/packages/hermes-chat-native` (a sibling
      repo, not part of this app's own codebase). Talks to
      `ASSISTANT_BASE_URL` (`src/lib/config.ts`) -- currently the dev
      machine's network address, NOT a real deployment yet; update that
      constant once the assistant backend is actually deployed. Uses
      `expo/fetch` for real streaming (RN's built-in `fetch` can't read a
      streaming response body). Conversation id persisted per-user in
      AsyncStorage under `assistant-conversation-id:<userId>`. The effective
      backend URL is resolved via
      `src/features/assistant/lib/assistantSettings.ts`'s
      `getAssistantBaseUrl()` (an AsyncStorage override under
      `celiyoapp:settings:assistant-base-url`, falling back to
      `ASSISTANT_BASE_URL`) -- editable from Settings > Assistant, not
      hardcoded to `src/lib/config.ts` alone.
- [x] Settings module — `src/features/settings/screens/SettingsScreen.tsx`,
      wired into `AppDrawer` as `"Settings"`. A `TabStrip`-based screen (one
      tab today: "Assistant" -- `AssistantSettingsTab.tsx`), the
      mobile-side equivalent of `@digitech/hermes-chat`'s web admin-panel
      onboarding: edit/reset the assistant backend URL, see live
      configured/unreachable status (`GET /api/hermes-admin/bootstrap`), and
      a button to open that backend's `/admin` panel (self-service bootstrap
      + backend-mode/branding/TeamOS config still happens there, not
      natively -- see `assistanceu/packages/hermes-chat`'s README).
- [x] Phase 1 — Foundation & shell (auth, theme, primitives, gated drawer,
      master hooks, blank dashboard)
- [x] Phase 2 — OPD + core clinical form renderer. `src/features/clinical/`
      is the dynamic form engine (types, visibility/compute/fieldMapping,
      `useAutosave` + AsyncStorage draft buffer, `ClinicalFormRenderer` +
      per-field-type components, `EmrWorkspace`/`EmrFormRail`/
      `EmrSaveIndicator`). `src/features/patients/` (read-only search/detail
      + `PatientPicker`) and `src/features/opd/` (visit list/detail/create,
      EmrWorkspace wired in, print via `src/lib/printing.ts`) both wired into
      `AppDrawer`.
- [x] OPD visit detail brought to celiyohms parity (see
      `OPD_BUILD_PROMPT.md` for the full spec this was built from — the list
      screen's own stats/Queue/Follow-ups/Reports tabs are still the lean
      Phase 2 version, not yet ported). `OpdVisitDetailScreen.tsx` now
      mirrors `IpdAdmissionDetailScreen.tsx`'s header-in-native-stack +
      fixed-`TabStrip` layout. Tabs: EMR (unchanged), Vitals
      (`VisitFinding`, latest-only, record form), Billing (multi-bill,
      ported from IPD's `BillingTab`/`BillDetailCard`/`BillItemsSection`/
      `PaymentsSection` at `/opd/opd-bills`+`/opd/opd-bill-items`, all four
      catalog types offered — a deliberate improvement over web, which only
      exposes Procedure), History (cross-encounter OPD+IPD timeline, reused
      `PatientDetailScreen`'s query pattern), Files (`/opd/visit-attachments`,
      `expo-document-picker` upload), WhatsApp (conditional on
      `useWhatsAppConfig().configured`, literally reuses
      `src/features/ipd/components/tabs/WhatsAppTab.tsx` — it's fully
      generic), Profile (**read-only** — reuses `usePatient()`, deliberately
      not porting web's full editable patient form here, to keep the
      "patient editing stays web-only outside New Visit/New Admission" rule
      intact; flagged explicitly rather than silently dropped).
      `derivePaymentStatus()` ported verbatim to `src/features/opd/
      constants.ts` — a Visit/Bill's raw `payment_status` field isn't
      authoritative for display, same rule IPD followed.
- [x] Phase 3 — IPD (reuses the Phase 2 renderer unchanged), later brought to
      feature parity with celiyohms's IPD workspace (see below).
      `src/features/ipd/` — admission list/detail, create, wired into
      `AppDrawer`. Detail screen tabs: Registration (full editable merged
      patient+admission form, ward/bed allot, bed transfer + history, photo
      capture via `expo-image-picker`), EMR (unchanged from Phase 2/3),
      Billing (multi-bill, catalog-picker add-item across procedure/package/
      service/investigation/custom, discounts, bed-day tracking, bill
      templates, payment recording), Discharge (AI discharge-packet
      generate/save/approve + discharge action form), Consents & Stationery
      (template checklist + batch print), Mediclaim (claim-status stepper,
      editable claim form, cancel mediclaim — shown only when
      `has_mediclaim`). List page has stats cards, ward/claim-status/
      payment-status/doctor/date-range filters, and CSV export via the share
      sheet.
- [x] WhatsApp chat tab — `src/features/ipd/components/tabs/WhatsAppTab.tsx`,
      wired into IPD admission detail, shown only when
      `useWhatsAppConfig().configured`. Bubbles (text/media/template), day
      separators, delivery-status ticks, 24h reply-window banner, reply bar.
      See the "WhatsApp — digicrm" backend note above for the credential-
      exposure tradeoff this required.
- [x] Full-screen print preview — `src/features/clinical/screens/
      PrintPreviewScreen.tsx` (registered in both `OpdStack` and `IpdStack`),
      a `react-native-webview` rendering the same A4-styled HTML the web
      app's `PrintPreviewModal` iframes (`GET /print/preview`), with a back
      button and a Share action that downloads+shares the actual PDF only
      when tapped. Every "Print" button (`EmrWorkspace`, `BillDetailCard`,
      `DischargeTab`) navigates here instead of downloading straight to the
      share sheet.
- [x] EMR round/occurrence support + remaining web action-parity buttons —
      `EmrRoundPills.tsx` (repeatable-form round switcher + "New Round"),
      `EmrBatchPrintModal.tsx` ("Print Multiple", `POST /print/batch`),
      `EmrTemplatesModal.tsx` (save/load/delete named field-value templates,
      `/clinical/form-templates`), Import from OPD
      (`POST /clinical/records/{id}/import-from-opd`, IPD only), and an
      explicit manual Save. `EmrWorkspace`'s action bar is now Lock/Complete
      as primary buttons + a "•••" bottom-sheet for the rest (Save, Print,
      Print Multiple, Templates, Import from OPD) — a deliberate mobile
      reorganization of web's button row, not a 1:1 layout copy.
- IPD admission detail header: patient name/admission id/ward-bed moved into
      the native stack header (`navigation.setOptions` + custom
      `headerTitle`/`headerRight`) instead of a body Card, so the tab strip
      sits directly under a compact header and content scrolls under a fixed
      tab strip. `RegistrationTab`'s Save button is a fixed bottom bar
      (outside the ScrollView), not something you scroll down to reach.
- Deliberately out of scope, even for "IPD feature parity" (see the IPD
      parity plan's "Context" section for the full reasoning): the clinical
      form-structure editor (admin form builder), Floor/Ward/Bed management
      (stays web-only — a Masters-admin screen, not part of IPD proper, and
      masters management is web-only for this app per the rule above), the
      list page's non-functional CSV **Import** stub and `comingSoon()` row
      actions (neither does anything on web either), web's client-composed
      "Print All Discharge Papers" (substituted with printing
      `admission_form`, which already embeds discharge info). Still deferred:
      `body_diagram` field editing.
- **List rendering rule** (learned the hard way): never nest a `FlatList`/
      `SectionList` inside an outer `ScrollView` of the same orientation —
      breaks windowing (RN warning) and can crash. Search-result/picker lists
      that live inside a form `ScrollView` (`PatientPicker`,
      `CatalogSearchField`, `InvestigationSearchCell`, `BillTemplatesPanel`)
      render as plain mapped `View`s instead, since they're always small
      (API-capped to ~15-20 rows) — nothing to virtualize. `FlatList`/
      `SectionList` stay fine inside a `Modal` (separate root) or as a
      screen's own top-level list (not nested in another scroll container).
- Needs on-device verification (not yet exercised on a real device/Expo Go):
      OPD visit → fill a form → confirm autosave → Complete; IPD Registration
      save + photo capture; bed allot/transfer; Billing add-item-from-
      catalog + payment recording; Discharge-packet generate/approve;
      Consents batch print; Mediclaim save/cancel; WhatsApp chat load/send;
      Print Preview screen (WebView rendering + Share); EMR round switching +
      Print Multiple + Templates + Import from OPD; the new sticky header/
      tab-strip/save-bar layout on a real screen size; OPD Vitals record,
      Billing add-item-from-catalog + payment, Files upload via
      `expo-document-picker` (multipart upload specifically — the RN
      FormData `{uri,name,type}` shape is easy to get subtly wrong and
      hasn't been exercised against the live endpoint yet), History
      cross-navigation to another OPD visit. Typecheck, unit tests, and an
      Android Metro/export bundle all pass, but no browser/device
      automation tool applies to Expo Go, so none of this has been
      click-tested end-to-end. Also untested on-device: the AI Assistant
      module (send/receive a message, streaming via `expo/fetch`, the
      Copilot picker, the history modal) -- `ASSISTANT_BASE_URL` also needs
      to actually be reachable from whatever device/emulator runs the app
      (same network / Tailscale as the dev machine, or updated to a real
      deployment).
