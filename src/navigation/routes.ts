import type { ModuleDef } from "../constants/modules";

export type AppDrawerParamList = {
  Dashboard: undefined;
  Module: { moduleId: string; title: string };
  Patients: undefined;
  Opd: undefined;
  Ipd: undefined;
  Assistant: undefined;
  Settings: undefined;
};

/** Module ids with a real nested stack instead of the generic placeholder route. */
export const STACK_ROUTES: Record<string, keyof AppDrawerParamList> = {
  dashboard: "Dashboard",
  patients: "Patients",
  opd: "Opd",
  ipd: "Ipd",
  assistant: "Assistant",
  settings: "Settings",
};

export type NavTarget =
  | { route: keyof AppDrawerParamList; params?: undefined }
  | { route: "Module"; params: { moduleId: string; title: string } };

/**
 * The one place that maps a module to a route. Both the drawer and the tab bar
 * call this, so a module can never navigate to two different destinations
 * depending on which surface you tapped.
 */
export function moduleTarget(mod: ModuleDef): NavTarget {
  const stackRoute = STACK_ROUTES[mod.id];
  if (stackRoute) return { route: stackRoute };
  return { route: "Module", params: { moduleId: mod.id, title: mod.label } };
}

/** True when `mod` owns the currently focused drawer route. */
export function isModuleActive(
  mod: ModuleDef,
  routeName: string,
  routeParams?: { moduleId?: string }
): boolean {
  const stackRoute = STACK_ROUTES[mod.id];
  if (stackRoute) return routeName === stackRoute;
  return routeName === "Module" && routeParams?.moduleId === mod.id;
}
