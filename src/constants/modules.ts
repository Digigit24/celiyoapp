/**
 * Mobile module registry — mirrors celiyohms/src/constants/navigation.ts
 * (NAV_SECTIONS) so the drawer gates exactly like the web sidebar.
 *
 * Masters management is web-only; mobile reads master data for dropdowns.
 * Modules with no Phase 1-3 mobile scope still render a placeholder screen
 * when visible — visibility itself is the permission gate.
 *
 * This file is the single source of truth for BOTH nav surfaces (bottom tab
 * bar + drawer). `splitNavSurfaces` guarantees a module never appears in both.
 */
import { hasPermission, type PrimaryRole } from "../lib/auth/permissions";

/** Drawer grouping — rendered in this order, one labelled section each. */
export type ModuleGroup =
  | "workspace"
  | "clinical"
  | "operations"
  | "administration";

export const GROUP_ORDER: ModuleGroup[] = [
  "workspace",
  "clinical",
  "operations",
  "administration",
];

export const GROUP_LABELS: Record<ModuleGroup, string> = {
  workspace: "Workspace",
  clinical: "Clinical",
  operations: "Operations",
  administration: "Administration",
};

export interface ModuleDef {
  id: string;
  label: string;
  /** Ionicons glyph name — lucide doesn't exist on RN; Ionicons ships with Expo. */
  icon: string;
  /** Filled variant, shown when the module is the active route. */
  activeIcon?: string;
  /** Drawer section. Modules promoted to the tab bar are omitted from the drawer. */
  group: ModuleGroup;
  permission?: string;
  hiddenForRoles?: PrimaryRole[];
  /** Which phase will implement the module (shown on the placeholder). */
  phase?: number;
}

export const MODULES: ModuleDef[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "grid-outline",
    activeIcon: "grid",
    group: "workspace",
  },
  {
    id: "assistant",
    label: "Assistant",
    icon: "chatbubbles-outline",
    activeIcon: "chatbubbles",
    group: "workspace",
  },
  {
    id: "patients",
    label: "Patients",
    icon: "people-outline",
    activeIcon: "people",
    group: "clinical",
    permission: "hms.patients.view",
    hiddenForRoles: ["pharmacist", "lab_technician"],
  },
  {
    id: "opd",
    label: "OPD",
    icon: "medkit-outline",
    activeIcon: "medkit",
    group: "clinical",
    permission: "hms.opd.view",
  },
  {
    id: "ipd",
    label: "IPD",
    icon: "bed-outline",
    activeIcon: "bed",
    group: "clinical",
    permission: "hms.ipd.view",
  },
  {
    id: "daycare",
    label: "Daycare",
    icon: "calendar-outline",
    activeIcon: "calendar",
    group: "clinical",
    permission: "hms.ipd.view",
    phase: 3,
  },
  {
    id: "clinical",
    label: "Clinical Records",
    icon: "document-text-outline",
    activeIcon: "document-text",
    group: "clinical",
    permission: "hms.clinical.view",
    phase: 2,
  },
  {
    id: "mrd",
    label: "MRD",
    icon: "archive-outline",
    activeIcon: "archive",
    group: "administration",
    permission: "hms.clinical.view",
    phase: 3,
  },
  {
    id: "payments",
    label: "Payments",
    icon: "card-outline",
    activeIcon: "card",
    group: "operations",
    permission: "hms.payments.view",
    phase: 3,
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: "medical-outline",
    activeIcon: "medical",
    group: "operations",
    permission: "hms.pharmacy.view",
    phase: 3,
  },
  {
    id: "diagnostics",
    label: "Lab",
    icon: "flask-outline",
    activeIcon: "flask",
    group: "operations",
    permission: "hms.diagnostics.view",
    phase: 3,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "cube-outline",
    activeIcon: "cube",
    group: "operations",
    permission: "hms.inventory.view",
    phase: 3,
  },
  {
    id: "admin",
    label: "Admin",
    icon: "shield-checkmark-outline",
    activeIcon: "shield-checkmark",
    group: "administration",
    permission: "admin.users.view",
    phase: 3,
  },
  {
    id: "reputation",
    label: "Reputation",
    icon: "star-outline",
    activeIcon: "star",
    group: "administration",
    permission: "hms.reputation.view",
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings-outline",
    activeIcon: "settings",
    group: "administration",
    hiddenForRoles: ["pharmacist", "lab_technician"],
  },
];

/**
 * Candidates for the bottom tab bar, most-used first. The first `MAX_TABS`
 * that survive permission filtering win a slot; everything else falls through
 * to the drawer, so a module is never listed in two places.
 */
export const TAB_PRIORITY = ["dashboard", "patients", "opd", "ipd", "assistant"];

/** Tab slots beside the centre FAB (2 left + 2 right). */
export const MAX_TABS = 4;

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  /** Tint for the action chip's icon puck. */
  color: string;
  permission?: string;
}

/** Centre-FAB actions — permission-gated the same way modules are. */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-opd-visit",
    label: "New OPD Visit",
    icon: "medkit",
    color: "#2563eb",
    permission: "hms.opd.view",
  },
  {
    id: "new-ipd-admission",
    label: "Admit Patient",
    icon: "bed",
    color: "#7c3aed",
    permission: "hms.ipd.view",
  },
  {
    id: "new-patient",
    label: "Register Patient",
    icon: "person-add",
    color: "#059669",
    permission: "hms.patients.view",
  },
];

/** Hide modules the user can't access — don't block them after tapping in. */
export function filterModules(
  modules: ModuleDef[],
  permissions: Record<string, unknown> | undefined,
  isSuperAdmin?: boolean,
  primaryRole?: PrimaryRole | null
): ModuleDef[] {
  return modules.filter((mod) => {
    if (primaryRole && mod.hiddenForRoles?.includes(primaryRole)) return false;
    if (!mod.permission) return true;
    return hasPermission(permissions, mod.permission, isSuperAdmin);
  });
}

/**
 * Split the visible modules across the two nav surfaces. `tabs` follows
 * TAB_PRIORITY order; `drawer` keeps registry order and holds the remainder.
 * The two lists are disjoint and together cover every visible module.
 */
export function splitNavSurfaces(visibleModules: ModuleDef[]): {
  tabs: ModuleDef[];
  drawer: ModuleDef[];
} {
  const tabs = TAB_PRIORITY.map((id) =>
    visibleModules.find((mod) => mod.id === id)
  )
    .filter((mod): mod is ModuleDef => Boolean(mod))
    .slice(0, MAX_TABS);

  const tabIds = new Set(tabs.map((mod) => mod.id));
  return { tabs, drawer: visibleModules.filter((mod) => !tabIds.has(mod.id)) };
}

/** Group the drawer modules, dropping sections that ended up empty. */
export function groupModules(
  modules: ModuleDef[]
): { group: ModuleGroup; label: string; modules: ModuleDef[] }[] {
  return GROUP_ORDER.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    modules: modules.filter((mod) => mod.group === group),
  })).filter((section) => section.modules.length > 0);
}

/** Quick actions the user is allowed to trigger. */
export function filterQuickActions(
  permissions: Record<string, unknown> | undefined,
  isSuperAdmin?: boolean
): QuickAction[] {
  return QUICK_ACTIONS.filter(
    (action) =>
      !action.permission ||
      hasPermission(permissions, action.permission, isSuperAdmin)
  );
}
