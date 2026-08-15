/**
 * Dashboard tap-through targets. The Dashboard screen is a flat Drawer.Screen
 * sibling to Opd/Ipd/Patients' own nested stacks, so drilling into a specific
 * visit/admission means navigating the drawer route with nested `screen`/
 * `params` — React Navigation supports this even though AppDrawerParamList
 * doesn't type the nested shape. Cast the whole `navigate` function to a
 * loose signature (same pattern ScreenShell already uses in AppDrawer.tsx)
 * rather than casting each call's arguments, which the strict overload
 * resolution rejects.
 */
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import type { AppDrawerParamList } from "../../navigation/routes";

type Nav = DrawerNavigationProp<AppDrawerParamList>;

function navigate(navigation: Nav, route: string, params?: object): void {
  (navigation.navigate as (route: string, params?: object) => void)(route, params);
}

export function goToOpd(navigation: Nav): void {
  navigate(navigation, "Opd");
}

export function goToOpdVisit(navigation: Nav, visitId: number): void {
  navigate(navigation, "Opd", { screen: "OpdVisitDetail", params: { visitId } });
}

export function goToIpd(navigation: Nav): void {
  navigate(navigation, "Ipd");
}

export function goToIpdAdmission(navigation: Nav, admissionId: number): void {
  navigate(navigation, "Ipd", { screen: "IpdAdmissionDetail", params: { admissionId } });
}

export function goToPatients(navigation: Nav): void {
  navigate(navigation, "Patients");
}

export function goToModule(navigation: Nav, moduleId: string, title: string): void {
  navigate(navigation, "Module", { moduleId, title });
}
