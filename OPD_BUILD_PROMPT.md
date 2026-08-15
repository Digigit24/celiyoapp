# Build prompt: bring celiyoapp's OPD module to full parity

Paste this whole file as your task prompt. It is self-contained — everything
needed to implement OPD end-to-end without further clarification is inside
it, including confirmed backend contracts and explicit decisions on every
ambiguity found in the reference web app.

## Role / framing

You are working in `C:\Users\hrith\ritik\Digitech\softwares\celiyoapp` — a
React Native (Expo SDK 54, managed, TypeScript) staff/admin mobile app for
DigiHMS. **Read `CLAUDE.md` at the repo root first** — it documents the
backends, the "no BFF, call directly" architecture, and the conventions
every screen must follow. This app's IPD module was recently brought to full
feature parity with the web reference app; **your job is to do the same for
OPD, reusing the exact same patterns, components, and conventions IPD
already established** — this is explicitly not a "build OPD from scratch in
your own style" task. Read the IPD code before writing anything (file list
below) and mirror its structure, naming, and UI idioms.

## Reference paths

- **Web UI reference (read, do not port code)**: `../celiyohms`
  (`C:\Users\hrith\ritik\Digitech\softwares\celiyohms`), a Next.js/React app.
  Reuse its UX flows, field sets, and business logic — never its components
  (shadcn/Radix/Tailwind don't run on RN). Key files to read directly:
  - `app/(hms)/opd/page.tsx` — list page shell (Visits/Queue/Follow-ups/Reports tabs)
  - `src/features/opd/components/OpdVisitsTab.tsx`, `OpdFilters.tsx`
  - `src/features/opd/components/QueueBoard.tsx` / `OpdQueueTab.tsx`
  - `src/features/opd/components/OpdFollowUpsTab.tsx`, `FollowUpForm.tsx`
  - `src/features/opd/components/OpdReportsTab.tsx`
  - `src/features/opd/components/NewVisitDrawer.tsx`
  - `app/(hms)/opd/consultation/[visitId]/page.tsx` — visit detail workspace
  - `src/features/opd/components/VitalsTab.tsx`, `BillingPanel.tsx`,
    `HistoryTab.tsx`, `FilesTab.tsx`, `ProfileTab.tsx`
  - `src/features/opd/components/OpdManageBillDrawer.tsx`
  - `src/features/clinical/components/EmrWorkspace.tsx` (shared clinical
    engine — same one IPD uses, see below)
- **Backend of record — dghms** (`../dghms`,
  `C:\Users\hrith\ritik\Digitech\softwares\dghms`), Django REST, mounted at
  `https://hms.celiyo.com/api/`. Relevant apps: `apps/opd`, `apps/clinical`,
  `apps/payments`. All endpoint contracts you need are already confirmed
  below — cross-check `apps/opd/views.py` / `serializers.py` /
  `filters.py` directly if anything is ambiguous.
- **This mobile app's existing OPD code (your starting point)**:
  - `src/lib/api/opd.ts` — already has `listVisits, getVisit, createVisit,
    updateVisit, getTodayVisits, getQueue, callNext, startVisit,
    completeVisit, setFollowUp`. Extend, don't replace.
  - `src/types/opd.ts` — `VisitListItem`, `VisitDetail`,
    `VisitCreatePayload`, `VisitQueue`, `SetFollowUpPayload` already exist.
  - `src/features/opd/hooks.ts` — `useVisits, useTodayVisits, useQueue,
    useVisit, useCreateVisit, useStartVisit, useCompleteVisit` already exist.
  - `src/features/opd/screens/OpdVisitListScreen.tsx` — currently a bare
    Today/Queue/All tab list, no stats/filters/follow-ups/reports.
  - `src/features/opd/screens/OpdVisitDetailScreen.tsx` — currently just a
    banner + Start/Complete buttons + the EMR tab (no Vitals/Billing/
    History/Files/WhatsApp/Profile tabs).
  - `src/features/opd/screens/NewOpdVisitScreen.tsx` — currently patient
    picker + doctor + visit type only. **This is correct — do not add the
    Clinical/Vitals/Billing-fee fields back in; see "New Visit" section
    below for why.**
  - `src/navigation/OpdStack.tsx` — registers `OpdVisitList`,
    `OpdVisitDetail`, `NewOpdVisit`, `PrintPreview`.
- **This mobile app's IPD code — the pattern to mirror** (read these before
  building the equivalent OPD screen):
  - `src/features/ipd/screens/IpdAdmissionListScreen.tsx` — stats cards,
    status `TabStrip`, filter panel, FAB "New Admission", CSV export,
    status-accent row cards. **Your OPD list screen should look and behave
    like this, adapted for OPD's own tabs (see below).**
  - `src/features/ipd/screens/IpdAdmissionDetailScreen.tsx` — header
    restructured into the native stack header (`navigation.setOptions` +
    custom `headerTitle`/`headerRight`), tab strip fixed directly under it,
    each tab as its own component under `components/tabs/`. **Copy this
    exact header/tab-strip pattern for the OPD visit detail screen.**
  - `src/features/ipd/components/tabs/RegistrationTab.tsx` — sticky bottom
    Save bar (fixed `View` outside the `ScrollView`, not scrolled-to).
  - `src/features/ipd/components/tabs/BillingTab.tsx` +
    `src/features/ipd/components/billing/{BillDetailCard,BillItemsSection,
    PaymentsSection,BillTemplatesPanel,CatalogSearchField}.tsx` — **OPD
    billing should reuse this exact structure** (see "Billing tab" below).
  - `src/features/ipd/components/tabs/MediclaimTab.tsx`,
    `ConsentsTab.tsx`, `WhatsAppTab.tsx` — component conventions.
  - `src/features/clinical/components/{EmrWorkspace,EmrRoundPills,
    EmrBatchPrintModal,EmrTemplatesModal}.tsx` — **the clinical engine is
    already fully built and shared** (rounds, batch print, templates,
    Import from OPD, Save/Print/Complete/Lock). OPD's EMR tab needs
    **zero new work** here beyond wiring — see "EMR tab" below.
  - `src/features/ipd/constants.ts` — status/color constant pattern
    (`ADMISSION_STATUS_VARIANT`, `ADMISSION_STATUS_ACCENT`, etc.) — build an
    equivalent `src/features/opd/constants.ts`.
  - `src/components/ui/{Card,TabStrip,Badge,PhotoPickerField}.tsx` — shared
    primitives, already shadow/radius-polished. Reuse, don't fork.
  - `src/lib/printing.ts` — `printAndShare`, `fetchPrintPreviewHtml`,
    `printBatch`, `printDocumentsBatch` all already exist and are
    encounter-agnostic (take a `formCode`/`recordId`) — reuse directly for
    OPD forms/bills, no new printing code needed.
  - `src/features/clinical/screens/PrintPreviewScreen.tsx` +
    `PrintPreviewNavigation` type — already registered in `OpdStack.tsx`.
    Every "Print" action in OPD should navigate here exactly like IPD's
    `BillDetailCard`/`DischargeTab` do (see their `handlePrint` functions).
  - `src/features/whatsapp/hooks.ts` (`useWhatsAppConfig`,
    `useWhatsAppChat`, `useSendWhatsAppText`) and
    `src/features/ipd/components/tabs/WhatsAppTab.tsx` — reuse the hooks
    as-is; OPD's WhatsApp tab is close to a copy-paste of IPD's, just fed
    the visit's `patient_mobile`/`patient_name` instead of the admission's.
  - `src/features/patients/screens/PatientDetailScreen.tsx` — its
    Overview/Visits/Admissions tab pattern is what OPD's **History** tab
    should reuse (same cross-encounter query shape, same UI).
  - `src/lib/csv.ts` (`exportCsvAndShare`) — reuse for OPD's own CSV export
    if you add one to the list screen (optional, see below).

## Mandatory conventions (do not deviate)

1. **No BFF, no new backend** — call `hms.celiyo.com` directly via the
   existing `hmsClient` axios instance (`src/lib/api/hmsClient.ts`).
2. **Never nest a `FlatList`/`SectionList` inside a `ScrollView` of the same
   orientation.** This bit IPD twice this session (patient search results,
   and a horizontal round-pills chip row that ballooned to ~400px because a
   bare horizontal `ScrollView` was a direct child of a `flex-1` column with
   no sized wrapper). Rules to follow:
   - Any result/picker list capped to a small page size (~15–25 rows) inside
     a form `ScrollView` → render as a plain mapped `View` list, not
     `FlatList`.
   - Any horizontal chip/pill row (status tabs, bill chips, round pills) →
     wrap in a **fixed-height** `View` (e.g. `style={{ height: 44 }}`) with
     the inner `ScrollView` given `style={{ flexGrow: 0 }}`, pills inside a
     `flex-row` `View` — copy `src/components/ui/TabStrip.tsx`'s scrollable
     branch verbatim as the template.
   - `FlatList`/`SectionList` are fine as a screen's own top-level list (not
     nested in another scroll container) or inside a `Modal` (separate root).
3. **Sticky/fixed chrome**: any screen with a primary action button
   (Save, Submit) that could require scrolling to reach must put that button
   in a fixed bottom bar outside the `ScrollView` (see
   `RegistrationTab.tsx`'s pattern: `View style={{paddingBottom:
   Math.max(insets.bottom, 12)}}` with a `shadow-lg shadow-black/10` to lift
   it off the content).
4. **Detail-screen headers**: patient/record summary (name, number, status)
   goes in the native stack header via `navigation.setOptions({headerTitle,
   headerRight})`, not a body `Card` — copy
   `IpdAdmissionDetailScreen.tsx`'s `HeaderTitle` pattern exactly.
5. **Printing**: always request the rendered document from dghms's printing
   app (`/api/print/*`) and route through `PrintPreviewScreen` for anything
   with a `formCode`+`recordId`; never generate PDFs on-device. Reuse
   `src/lib/printing.ts`'s existing functions.
6. **Client-derived payment status**: dghms's `payment_status` field on a
   Visit/Bill is not authoritative for list/detail display — celiyohms
   computes it client-side from `total_amount`/`paid_amount`/
   `balance_amount` (see `derivePaymentStatus()` contract below). Port this
   exact logic as a pure function in `src/features/opd/constants.ts`
   (mirroring `formatStayDuration` in `src/features/ipd/constants.ts`).
7. Run `npm run typecheck` and `npm test` after each screen lands, then
   `npx expo export --platform android` once the whole module is wired, same
   checkpoints IPD used.

## Confirmed backend contracts

Base path `/api/opd/` unless noted. Pagination envelope
`{success, count, next, previous, results}`. Action envelope
`{success, message?, data}` unless noted otherwise.

### Visits (`/opd/visits/`) — mostly already wired in `src/lib/api/opd.ts`
- `GET /opd/visits/?search=&status=&visit_type=&priority=&doctor=&payment_status=&visit_date__gte=&visit_date__lte=&follow_up_required=&follow_up_date_from=&follow_up_date_to=&ordering=` — already have `listVisits`. **Add `priority` to `VisitListParams`** (missing today).
- `GET /opd/visits/{id}/` — already have `getVisit`.
- `POST /opd/visits/` `VisitCreatePayload` — already have `createVisit`.
- `PATCH /opd/visits/{id}/` — already have `updateVisit`.
- `DELETE /opd/visits/{id}/` — **missing, add `deleteVisit(id)`.**
- `GET /opd/visits/today/` → `{success,count,data:[...]}` — already have.
- `GET /opd/visits/queue/?doctor=me` → `{waiting,called,in_consultation}` —
  already have `getQueue`; the `doctor=me` param is supported server-side
  but web's Queue tab never sends it (always clinic-wide) — match that,
  don't default to `me`.
- `POST /opd/visits/call_next/?doctor_id=` — already have `callNext`,
  currently unused by any screen. Web's Queue tab has **no UI trigger for
  this at all** (confirmed dead-in-OPD-context on web) — you may **add** a
  "Call Next" button to the mobile Queue tab as a deliberate improvement
  over web (it's a natural mobile action and the endpoint already exists),
  but it is not a straight port — note it as an addition, not parity.
- `POST /opd/visits/{id}/start/` — already have `startVisit`.
- `POST /opd/visits/{id}/complete/` body `{diagnosis?, follow_up_date?, notes?}` — already have `completeVisit`.
- `POST /opd/visits/{id}/set_follow_up/` body `{follow_up_required, follow_up_date, follow_up_notes?}` — already have `setFollowUp`.
- `GET /opd/visits/statistics/?date_from=&date_to=&period=&group_by=day` →
  `{success, period, date_from, date_to, data: {total_visits, by_status:
  {waiting,called,in_consultation,completed,cancelled,no_show}, total_revenue,
  daily_trend?}}` — **new, add `getVisitStatistics(params)`**. Cached
  server-side 60s for the no-param ("today") case.
- `GET /opd/visits/export` — **confirmed broken on web (404, no matching
  backend route exists)**. Do not port a CSV/XLSX export button wired to
  this path. If you want CSV export on the list screen, build it exactly
  like IPD's (`exportCsvAndShare`, client-side from the already-fetched
  page), matching the pattern, not this endpoint.
- `GET /opd/visits/doctor_stats/?date_from=&date_to=&doctor=me` — exists,
  unused by any current OPD screen (web's Reports tab is a stub — see
  below). Not required for this build; note its existence for a future
  Reports implementation.

### Visit Findings / Vitals (`/opd/visit-findings/` — new file needed: `src/lib/api/opdVitals.ts` or extend `opd.ts`)
- `GET /opd/visit-findings/?visit={id}&ordering=-finding_date` → paginated
  list of `VisitFinding`. Fields: `id, visit, finding_date, finding_type
  (examination|systemic), temperature (°F, 90-110), pulse (30-300),
  bp_systolic (50-300), bp_diastolic (30-200), weight (kg), height (cm), bmi
  (readonly), spo2 (0-100), respiratory_rate (5-60), tongue, throat, cns, rs,
  cvs, pa, blood_pressure (readonly "sys/dia"), bmi_category (readonly),
  recorded_by_id`.
- `POST /opd/visit-findings/` create payload — web's Record Vitals drawer
  only exposes `{temperature, pulse, bp_systolic, bp_diastolic, spo2,
  weight}` (height/respiratory_rate exist on the model/type but aren't
  rendered by that form — you may include them on mobile since the field
  supports it, it's a reasonable improvement, not required for parity).
- Show only the **latest** finding in the Vitals tab (`results[0]` of the
  `-finding_date`-ordered list) — no history chart, matching web exactly.

### Visit Attachments / Files (`/opd/visit-attachments/` — new file: `src/lib/api/opdAttachments.ts`)
- `GET /opd/visit-attachments/?visit={id}` → paginated list. Field names
  confirmed from the frontend type: `id, visit, file (URL string), file_name,
  file_type (xray|report|prescription|scan|document|other), description,
  uploaded_by_id, uploaded_at`. **Field names are `file` and `uploaded_at`**
  — not `file_url`/`created_at`, confirm before wiring.
  - Uses `multipart/form-data` — build with expo's standard `FormData` +
    `expo-file-system` file URI or `expo-document-picker` result, same
    upload pattern as `hmsClient.post(url, formData, {headers:
    {'Content-Type':'multipart/form-data'}})`.
- `DELETE /opd/visit-attachments/{id}/`.
- **New dependency needed**: `expo-document-picker` (Expo Go-compatible) —
  attachments include non-image types (reports, prescriptions as files),
  so `expo-image-picker` alone (already installed, used for patient/guardian
  photos) isn't sufficient here. Install with
  `npx expo install expo-document-picker`.

### OPD Bills (`/opd/opd-bills/`, `/opd/opd-bill-items/` — new file: `src/lib/api/opdBilling.ts`)
Structural note: **OPD supports multiple independent bills per visit**
(e.g. separate bills for consultation vs. pharmacy), same multi-bill model
IPD billing already has — **reuse the exact `IPDBilling`-shaped component
architecture** (`BillingTab` → bill chips → `BillDetailCard` → items/
payments sub-tabs), just pointed at these OPD endpoints instead.
- `GET /opd/opd-bills/?visit={id}&doctor=&payment_status=&opd_type=&charge_type=&search=` → paginated `OPDBill[]`. Fields: `id, bill_number, visit,
  visit_number, patient_name, doctor, doctor_name, bill_date, opd_type,
  opd_subtype, charge_type, diagnosis, remarks, total_amount, discount_percent,
  discount_amount, payable_amount, payment_mode, payment_details, received_amount,
  balance_amount, payment_status, items: OPDBillItem[], created_at, updated_at`.
- `POST /opd/opd-bills/` body `{visit, doctor?, opd_type, opd_subtype?, charge_type, bill_date?, diagnosis?, remarks?}` — `total_amount`/`payable_amount`/etc. are server-derived from items, don't send them.
- `PATCH /opd/opd-bills/{id}/` `{discount_percent}` for the discount flow.
- `POST /opd/opd-bills/{id}/record_payment/` body `{amount, payment_mode
  (cash|card|upi|bank|razorpay|multiple), payment_details?, notes?}` →
  `{success,message,data: OPDBill}`. **Note**: web's own Payment form UI
  only offers Cash/Card/UPI/Bank Transfer/Multiple as selectable modes even
  though the type supports more — match web's mode list in the picker, but
  there's no reason not to offer the same full `IPD_PAYMENT_MODES` list
  already defined in `src/features/ipd/constants.ts` if you'd rather be
  consistent with IPD-mobile than strictly with web here; either is
  defensible, pick one and note the choice in a comment.
- `GET/POST/PATCH/DELETE /opd/opd-bill-items/?bill=&source=&search=` —
  `{id, bill, item_name, source (Pharmacy|Lab|Radiology|Consultation|
  Procedure|Other), quantity, unit_price, system_calculated_price (readonly),
  total_price (readonly), is_price_overridden (readonly), notes}`.
- **Payments ledger** (cross-bill "All Transactions" view, optional but
  recommended for parity): `GET /payments/bill-payments/?opd_bill={id}` —
  same `apps.payments.BillPayment` model IPD already uses
  (`src/lib/api/payments.ts`'s `listBillPayments` currently only accepts
  `ipd_bill` — **extend it to accept either `ipd_bill` or `opd_bill`**, or
  add a sibling `listOpdBillPayments(billId)`). IPD-mobile does **not**
  currently have a cross-bill aggregate view (only per-bill payments via
  `PaymentsSection`) — building one for OPD is a reasonable enhancement
  (web has `AllTransactionsPanel`: 3-stat summary + date-grouped feed across
  every bill on the visit) but not required; if you build it, consider
  backporting the same panel to IPD billing for consistency.
- **Catalog picker for Add Item**: reuse `src/lib/api/catalog.ts` and
  `src/features/ipd/components/billing/CatalogSearchField.tsx` **as-is** —
  they already hit `/opd/procedure-masters`, `/opd/services`,
  `/opd/procedure-packages` (tenant-shared catalogs, not IPD-specific).
  Web's OPD billing UI only exposes the Procedure catalog in its picker
  (Service/Package catalogs are wired in `api.ts` but never surfaced from
  any OPD screen) — **mobile should offer all catalog types** (Procedure/
  Package/Service, plus Investigation via the existing
  `searchInvestigations`) for consistency with IPD-mobile's
  `AddBillItemForm`-equivalent, since the components already support it at
  no extra cost. This is a deliberate improvement over web, not a parity gap.
- **Print**: `formCode="opd_bill"`, `recordId=<bill id>` through the
  existing `PrintPreviewScreen`/`printBatch` pipeline (batch = merge every
  bill on the visit into one PDF, mirrors IPD's per-record batch print).

### Clinical / EMR — already fully built, zero new backend work
OPD's EMR tab is `EmrWorkspace` with `encounterType="opd_visit"` — **exactly
the component already wired into `OpdVisitDetailScreen.tsx` today.** It
already includes (all shared with IPD, built this session): round/occurrence
support for repeatable forms, Print, Print Multiple (batch print), Templates
(save/load/delete), Save, Lock/Complete. **Two things to check/confirm, not
build**:
1. **"Import from OPD" must stay IPD-only** — `EmrWorkspace.tsx` already
   gates this button on `encounterType === "ipd_admission"`; verify it does
   NOT render for OPD (matches web exactly — the button doesn't exist on
   OPD's EMR toolbar there either, since importing "from OPD" into an OPD
   visit is meaningless).
2. **Prescription and investigation entry are the embedded clinical-form
   grid fields already supported** (`PrescriptionGridField`/
   `InvestigationGridField` inside `ClinicalFormRenderer`, section
   `config.role === "prescription"|"investigation"`) — confirmed as the
   **only live prescription/investigation entry point for OPD on web today**
   (the standalone inventory-linked pharmacy `Prescription` CRUD system
   exists in the web app but is reachable only through a secondary
   "Manage Billing" drawer, not the main consultation page, and is
   explicitly out of scope here — matches the precedent already set by
   IPD's build, which also excluded standalone pharmacy dispensing/lab
   dashboards). **Do not build a separate prescription screen** — it
   already works via the EMR tab with zero extra code.

### Reports — build as a placeholder, matching web exactly
Web's `OpdReportsTab` is a literal "Reports coming soon" empty state with
**zero data wiring** — not a stub to fill in, an intentional not-yet-built
screen. Build the mobile equivalent the same way: an `EmptyState` with
title "Reports coming soon" and a message noting daily/weekly analytics,
doctor stats, and revenue charts are planned. Do not invent a real Reports
screen even though `statistics`/`doctor_stats` endpoints exist — that would
be building ahead of the web app, which isn't what this task is asking for
(if you want to flag it as a good follow-up task, do so in a code comment,
not by building it now).

## Screens to build

### 1. `OpdVisitListScreen.tsx` — rework to match `IpdAdmissionListScreen.tsx`
- **Tabs** (`TabStrip`, scrollable): Visits (default) / Queue / Follow-ups /
  Reports. Keep the existing Today-view logic folded into "Visits" as a
  quick filter chip or date-range default (today), rather than a separate
  tab — web's actual list page doesn't have a "Today" tab distinct from
  Visits; it's a date-range filter defaulting to today (see below). This
  replaces the current Today/Queue/All tab set.
- **Header**: search input, date-range filter (`DatePresetChips`-equivalent
  — a simple set of quick chips: Today/This Week/This Month/All, plus the
  existing `@react-native-community/datetimepicker` two-field custom range,
  matching the pattern already built for `IpdAdmissionListScreen`'s date
  filters) driving both the stats row and the Visits list.
- **Stats row** (4-6 `StatCard`s, mirror `IpdAdmissionListScreen`'s
  icon+tint pattern exactly): Total Visits, Waiting, In Consultation,
  Completed, Cancelled, Revenue (₹, only if `total_revenue != null`) — from
  `useOpdStatistics(dateFrom, dateTo)` (new hook, `getVisitStatistics`).
- **Visits tab**: filter panel (Status/Type/Priority selects + doctor-name
  free-text — match web's client-side doctor-name substring filter, or
  simplify to a doctor `Select` via `useDoctors()` like IPD's list filter
  does, which is arguably better UX; your call, note which you picked), row
  cards styled exactly like `IpdAdmissionListScreen`'s `AdmissionRow`
  (status-accent left bar, patient initials avatar, status dot). Row tap →
  visit detail. **Skip the broken Export-to-XLSX button**; if you add CSV
  export, use `exportCsvAndShare` like IPD, not the dead
  `/opd/visits/export` endpoint.
  - **Derived payment status** (port `derivePaymentStatus()` verbatim as a
    pure function): `no_bill` (no bill exists) → gray "No bill"; `paid`
    (balance ≈ 0) → emerald, shows `total_amount`; `partial` (paid > 0,
    balance > 0) → amber, shows `balance_amount`; `unpaid` → rose, shows
    `balance_amount`. Use this for the row's trailing amount/badge instead
    of the raw `payment_status` field.
  - Row overflow menu or swipe actions (optional — a simple long-press or a
    trailing "⋯" is fine): Start (waiting/called only), Complete
    (in_consultation only), Delete (confirm via `Alert.alert`, destructive).
    Bill shortcut can just navigate to the visit detail's Billing tab
    (`initialTab` param, same mechanism `IpdStack`'s
    `IpdAdmissionDetail.initialTab` already uses).
- **Queue tab**: three stacked sections (Waiting/Called/In Consultation,
  amber/blue/green headers with counts) from `useQueue()` (already exists),
  auto-refresh already wired (20s). Card per visit: queue position, priority
  badge (hidden if "normal"), patient name+id, status badge, waiting time,
  doctor name. Tap → visit detail. Add a manual Refresh button. Consider
  adding a "Call Next" button (see contracts section — deliberate addition,
  not a web port).
- **Follow-ups tab**: bucket chips (Overdue/Today/Tomorrow/+4 more days/
  Later) computed client-side from `useVisits({follow_up_required: true,
  follow_up_date_from, follow_up_date_to, page_size: 500})` over a fixed
  30-days-behind/6-days-ahead window (port `assignBucket`/`buildBuckets`
  logic). Card per visit: avatar, name/id, follow-up badge (relative due
  date), mobile (tap-to-call via `Linking.openURL('tel:...')`), doctor,
  type/status badges, due date. **Fix web's mislabeled action**: web has two
  buttons both labeled to navigate to the visit ("Open consultation" and
  "New follow-up visit") that do the exact same thing — on mobile, use a
  single, correctly-labeled "Open visit" action (tap the card itself),
  don't replicate the confusing duplicate/mislabeled buttons.
- **Reports tab**: `EmptyState` placeholder, see contracts section above.
- **FAB**: "New Visit" floating action button, bottom-right, exactly like
  IPD's "New Admission" FAB.

### 2. `OpdVisitDetailScreen.tsx` — rework to match `IpdAdmissionDetailScreen.tsx`
- Header restructure: patient name + visit number/doctor/date into
  `navigation.setOptions({headerTitle, headerRight})` (status badge in
  `headerRight`), exactly like IPD's `HeaderTitle` component. Remove the
  current body `Card`.
- Tab strip fixed under the header (`scrollable` `TabStrip`, same
  `shadow-sm` container styling as IPD's).
- **Tabs**: EMR (default) / Vitals / Billing / History / Files / WhatsApp
  (conditional on `useWhatsAppConfig().configured`, exactly like IPD) /
  Profile.
  - Permission gating exists on web for some of these (Billing needs
    `hms.opd.bill`, EMR needs `hms.opd.consult` or `hms.clinical.view`) but
    web's own row actions/other tabs mostly skip client-side gating and
    trust the backend. Match IPD-mobile's existing precedent: IPD doesn't
    client-gate its tabs by permission either (aside from the WhatsApp
    config check) — stay consistent, don't add gating OPD didn't get either
    unless you're deliberately improving both together.
- **EMR tab**: literally the existing `EmrWorkspace` component, already
  wired — no changes needed beyond moving it under the new tab-strip
  structure (it currently is the *only* content of this screen; now it
  becomes one tab among several).
- **Vitals tab** (new `src/features/opd/components/tabs/VitalsTab.tsx`):
  latest `VisitFinding` shown as a labeled grid (Temp/Pulse/BP/SpO2/Weight/
  BMI), "Record Vitals" button opening a form (bottom sheet or inline,
  match the `RegistrationTab`/billing-form modal idiom already established)
  with Temperature/Pulse/BP Systolic/BP Diastolic/SpO2/Weight inputs →
  `POST /opd/visit-findings/`.
- **Billing tab**: build `src/features/opd/components/tabs/BillingTab.tsx`
  as a near-direct port of `src/features/ipd/components/tabs/BillingTab.tsx`
  + its `billing/` sub-components, retargeted at the OPD bill endpoints (see
  contracts above). Reuse `CatalogSearchField` unchanged.
- **History tab** (new `src/features/opd/components/tabs/HistoryTab.tsx`):
  reuse the Overview/Visits/Admissions query pattern from
  `src/features/patients/screens/PatientDetailScreen.tsx` — this visit's
  patient's OPD visit history (`listVisits({patient: patientId})`) and IPD
  admission history (`listAdmissions({patient: patientId})`), current visit
  marked/non-clickable, others tap-through to their own detail screens.
- **Files tab** (new `src/features/opd/components/tabs/FilesTab.tsx`):
  list of attachments (filename, file-type icon, tap to open/download via
  `Linking.openURL(item.file)`, delete via trash icon + confirm), "Upload"
  button using `expo-document-picker` → multipart POST to
  `/opd/visit-attachments/`.
- **WhatsApp tab**: near-copy of
  `src/features/ipd/components/tabs/WhatsAppTab.tsx`, fed
  `visit.patient_mobile`/`visit.patient_name` instead of the admission's.
  Consider factoring the shared bubble/day-separator/reply-bar rendering
  into a common component under `src/features/whatsapp/` if duplicating it
  verbatim feels wrong, but this is optional polish, not required.
- **Profile tab**: **recommended default — read-only**, reusing
  `PatientDetailScreen`'s Overview content (or a compact inline version)
  rather than porting celiyohms's full editable patient-profile form. This
  keeps mobile consistent with the existing project-wide rule ("patient
  management stays web-only" beyond the New Visit/New Admission inline
  creation flow — see `CLAUDE.md`'s "Scope rules" section). If you want an
  editable Profile tab instead (matching web exactly), that's a deliberate
  scope expansion beyond what's currently established for this app —
  flag it explicitly rather than silently building it, since it reopens a
  boundary this app has held consistently through both the IPD and Patients
  modules.

### 3. `NewOpdVisitScreen.tsx` — mostly correct already, small additions
Current screen (patient picker + doctor + visit type) is **intentionally
correct as-is** — web's equivalent wizard collects Chief Complaint/Symptoms/
Notes/full Vitals/Consultation Fee/Additional Charges fields but **silently
discards all of them on submit** (confirmed: `VisitCreatePayload`/
`VisitCreate` on the backend has no matching fields) — replicating that form
would just be UI that lies to the user. Keep the current lean form. Consider
these small, real additions (all actually persist, unlike the fields you're
skipping):
- **Priority** select (Low/Normal/High/Urgent) — real field on `Visit`,
  currently missing from the mobile create form.
- **Reference doctor** select + "notify referring doctor" checkbox — real
  fields (`referred_by`, `notify_referring_doctor`), currently missing.
- Do **not** add Chief Complaint/Symptoms/Vitals/Fees inputs — there is
  nowhere for them to go; vitals belong in the visit detail's real Vitals
  tab (persists via `VisitFinding`), clinical notes belong in EMR forms.
- Keep the existing "Done"-less flow (mobile creates then navigates straight
  to detail, matching what `NewIpdAdmissionScreen` already does) rather than
  porting web's separate Done-state screen with "Print Visit Slip"/"Register
  Another" — optionally add a "Print visit slip" affordance on the newly
  created visit's detail screen instead (it already has print wiring via
  the EMR/Billing tabs' pattern), since a dedicated Done screen isn't how
  this app's IPD flow works either (stay consistent).

## Status/color constants — `src/features/opd/constants.ts` (new file)
Port these exactly (see celiyohms's `VisitBadges.tsx`/`PaymentBadge`/
`BillingPanel`'s `BILL_STATUS`/`MODE_BADGE` for the source values — note web
itself has a minor inconsistency between `VisitBadges`' and `HistoryTab`'s
status-color maps for `in_consultation`; pick **one** canonical mapping and
use it everywhere on mobile, don't replicate the inconsistency):
- `VISIT_STATUS_VARIANT`: waiting→warning, called→default, in_consultation→default, completed→success, cancelled→secondary, no_show→destructive (mirrors the existing `STATUS_VARIANT` already in `OpdVisitListScreen.tsx` — keep it, just relocate to `constants.ts` alongside the rest).
- `VISIT_PRIORITY_VARIANT`: low→secondary, normal→(don't render a badge at all, matches web hiding it), high→warning, urgent→destructive.
- `VISIT_TYPE_VARIANT`: new→default, follow_up→secondary, emergency→destructive, referral→outline (pick colors reasonably close to web's sky/purple/red/teal using existing `BadgeVariant` options).
- `derivePaymentStatus(visit): "no_bill" | "unpaid" | "partial" | "paid"` — pure function per the logic above.
- `PAYMENT_STATUS_VARIANT`: unpaid→destructive, partial→warning, paid→success, no_bill→secondary.
- Bill-level status variant + `OPD_BILL_ITEM_SOURCE_COLOR` (Consultation/Pharmacy/Lab/Radiology/Procedure/Other) — mirror `BILL_ITEM_SOURCE_COLOR` in `src/features/ipd/constants.ts`, same color family, extra note that OPD's source enum is a subset of IPD's.

## Explicit exclusions (do not build)
- Standalone inventory-linked pharmacy Prescription CRUD (`PrescriptionDrawer`/`PrescriptionMedicineGrid`) and its dispense/stock-tracking workflow — matches the precedent IPD's build already set (pharmacy dispensing/lab dashboards excluded there too).
- `OpdManageBillDrawer`'s parallel lightweight "Clinical" tab (a second, simpler UI over the same clinical records, distinct from `EmrWorkspace`) — the full `EmrWorkspace` tab is canonical; don't build a second, divergent EMR surface.
- `VisitDetailDrawer.tsx` — confirmed dead code on web (not imported/rendered anywhere), not a real screen to port.
- A real Reports tab — placeholder only, see above.
- `GET /opd/visits/export` — confirmed broken on web, don't wire to it.
- The admin clinical form-structure editor (gear icon in `EmrWorkspace`) — already excluded from the shared component for IPD; stays excluded here too, nothing to do.

## Verification
- `npm run typecheck` and `npm test` after each screen.
- `npx expo export --platform android` once the whole module is wired, to
  confirm the bundle still builds clean (matches every checkpoint used for
  IPD).
- Manually re-read `IpdAdmissionListScreen.tsx` and
  `IpdAdmissionDetailScreen.tsx` side-by-side with your new OPD equivalents
  before calling this done — they should visually and structurally read as
  siblings, not as two different apps.
- Flag for on-device verification (same caveat as IPD — no browser/device
  automation applies to Expo Go): New Visit → EMR form fill → autosave →
  Complete; Vitals record; Billing add-item-from-catalog + payment;
  Attachments upload/delete; Follow-up scheduling + bucket display; WhatsApp
  chat load/send; Queue auto-refresh.
