/**
 * Inventory module — demo data and shared constants.
 *
 * No backend exists yet for the Inventory module (Phase 3). The constants
 * below are realistic-looking fixtures used by the hooks until the real
 * `./lib/api/inventory` lands. When the API arrives, the hook swap is the
 * only change required — the screen contract stays stable.
 *
 * __demo: true — these fixtures are placeholders, not production data.
 */

import type { Ionicons } from "@expo/vector-icons";
import type { ChipVariant } from "../../components/ui";

export type ItemCategory = "medicine" | "consumable" | "equipment";

export type StockMovementType = "received" | "issued" | "adjusted";

export interface StockMovementEvent {
  type: StockMovementType;
  /** Positive for received/adjust-up, negative for issued/adjust-down. */
  qtyDelta: number;
  performedBy: string;
  when: string;
  note?: string;
}

export interface InventoryItem {
  id: string;
  itemRef: string;
  name: string;
  category: ItemCategory;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  /** ISO yyyy-mm-dd. Omitted for items that don't expire (most equipment). */
  expiryDate?: string;
  batchNo: string;
  supplier: string;
  /** Unit cost in INR (₹). */
  unitCost: number;
  movements: StockMovementEvent[];
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  medicine: "Medicine",
  consumable: "Consumable",
  equipment: "Equipment",
};

export const CATEGORY_CHIP_VARIANT: Record<ItemCategory, ChipVariant> = {
  medicine: "info",
  consumable: "success",
  equipment: "neutral",
};

export const CATEGORY_FILTER_OPTIONS: Array<{ id: "all" | ItemCategory; label: string }> = [
  { id: "all", label: "All" },
  { id: "medicine", label: "Medicine" },
  { id: "consumable", label: "Consumable" },
  { id: "equipment", label: "Equipment" },
];

export const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  received: "Received",
  issued: "Issued",
  adjusted: "Adjusted",
};

export const MOVEMENT_TYPE_ICON: Record<StockMovementType, keyof typeof Ionicons.glyphMap> = {
  received: "arrow-down-circle",
  issued: "arrow-up-circle",
  adjusted: "swap-horizontal",
};

export const MOVEMENT_TYPE_TINT: Record<
  StockMovementType,
  "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"
> = {
  received: "emerald",
  issued: "blue",
  adjusted: "amber",
};

/** Reference "today" for expiry-tint math — mirrors the environment's current date. */
export const TODAY_ISO = "2026-08-17";

export function isLowStock(item: Pick<InventoryItem, "currentStock" | "reorderLevel">): boolean {
  return item.currentStock <= item.reorderLevel;
}

/** Days until expiry (negative if already expired). `null` when there's no expiry date. */
export function daysUntilExpiry(expiryDate: string | undefined, today: string = TODAY_ISO): number | null {
  if (!expiryDate) return null;
  const toDays = (iso: string) => {
    const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
    return Date.UTC(y, m - 1, d) / 86_400_000;
  };
  return Math.round(toDays(expiryDate) - toDays(today));
}

export function isExpiringSoon(expiryDate: string | undefined, today: string = TODAY_ISO): boolean {
  const days = daysUntilExpiry(expiryDate, today);
  return days !== null && days >= 0 && days <= 60;
}

export function isExpired(expiryDate: string | undefined, today: string = TODAY_ISO): boolean {
  const days = daysUntilExpiry(expiryDate, today);
  return days !== null && days < 0;
}

/** Format an INR (₹) amount, matching the Payments module's convention. */
export function formatINR(amount: number): string {
  if (Number.isInteger(amount)) return `₹${amount.toLocaleString("en-IN")}`;
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "17 Aug 2026" display format for an ISO yyyy-mm-dd date. */
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d} ${months[m - 1] ?? "—"} ${y}`;
}

// __demo: true — placeholder fixtures used until the inventory API is wired.
export const DEMO_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "inv-0001",
    itemRef: "INV-0001",
    name: "Amoxicillin 500mg",
    category: "medicine",
    currentStock: 420,
    reorderLevel: 150,
    unit: "capsules",
    expiryDate: "2027-03-15",
    batchNo: "AMX-2601",
    supplier: "Cipla Ltd.",
    unitCost: 4.2,
    movements: [
      { type: "received", qtyDelta: 500, performedBy: "Store Keeper · Ravi P.", when: "1 Aug, 09:10", note: "New batch AMX-2601" },
      { type: "issued", qtyDelta: -80, performedBy: "Pharmacist · Suresh N.", when: "10 Aug, 14:20", note: "Dispensed to OPD" },
    ],
  },
  {
    id: "inv-0002",
    itemRef: "INV-0002",
    name: "Insulin Glargine 100IU/ml",
    category: "medicine",
    currentStock: 6,
    reorderLevel: 15,
    unit: "vials",
    expiryDate: "2026-09-30",
    batchNo: "INS-2544",
    supplier: "Sanofi India",
    unitCost: 620,
    movements: [
      { type: "received", qtyDelta: 20, performedBy: "Store Keeper · Ravi P.", when: "22 Jul, 10:00" },
      { type: "issued", qtyDelta: -1, performedBy: "Pharmacist · Meena K.", when: "17 Aug, 09:52", note: "RX-2026-0002" },
      { type: "adjusted", qtyDelta: -13, performedBy: "Store Keeper · Ravi P.", when: "17 Aug, 09:30", note: "Cold-chain breach — 13 vials discarded" },
    ],
  },
  {
    id: "inv-0003",
    itemRef: "INV-0003",
    name: "Surgical Gloves (Size M)",
    category: "consumable",
    currentStock: 2400,
    reorderLevel: 500,
    unit: "pairs",
    expiryDate: "2028-01-01",
    batchNo: "GLV-1187",
    supplier: "Dynarex Corp.",
    unitCost: 6.5,
    movements: [
      { type: "received", qtyDelta: 3000, performedBy: "Store Keeper · Ravi P.", when: "5 Aug, 11:00" },
      { type: "issued", qtyDelta: -600, performedBy: "Nurse Store · Kavita J.", when: "14 Aug, 08:40", note: "OT stock replenishment" },
    ],
  },
  {
    id: "inv-0004",
    itemRef: "INV-0004",
    name: "N95 Respirator Masks",
    category: "consumable",
    currentStock: 85,
    reorderLevel: 200,
    unit: "pieces",
    expiryDate: "2026-10-05",
    batchNo: "N95-0932",
    supplier: "3M India",
    unitCost: 28,
    movements: [
      { type: "received", qtyDelta: 500, performedBy: "Store Keeper · Ravi P.", when: "1 Jul, 09:00" },
      { type: "issued", qtyDelta: -415, performedBy: "Nurse Store · Kavita J.", when: "16 Aug, 15:10", note: "ICU + isolation ward" },
    ],
  },
  {
    id: "inv-0005",
    itemRef: "INV-0005",
    name: "Digital Infusion Pump",
    category: "equipment",
    currentStock: 12,
    reorderLevel: 4,
    unit: "units",
    batchNo: "EQ-INF-08",
    supplier: "B. Braun Medical",
    unitCost: 42000,
    movements: [
      { type: "received", qtyDelta: 15, performedBy: "Biomedical Eng. · Farhan A.", when: "12 Jan, 10:00" },
      { type: "adjusted", qtyDelta: -3, performedBy: "Biomedical Eng. · Farhan A.", when: "3 Jul, 16:30", note: "3 units sent for AMC repair" },
    ],
  },
  {
    id: "inv-0006",
    itemRef: "INV-0006",
    name: "Paracetamol 650mg",
    category: "medicine",
    currentStock: 1800,
    reorderLevel: 400,
    unit: "tablets",
    expiryDate: "2027-06-20",
    batchNo: "PCM-3312",
    supplier: "Sun Pharma",
    unitCost: 0.9,
    movements: [
      { type: "received", qtyDelta: 2000, performedBy: "Store Keeper · Ravi P.", when: "9 Aug, 09:30" },
      { type: "issued", qtyDelta: -200, performedBy: "Pharmacist · Suresh N.", when: "16 Aug, 12:00" },
    ],
  },
  {
    id: "inv-0007",
    itemRef: "INV-0007",
    name: "IV Cannula 18G",
    category: "consumable",
    currentStock: 340,
    reorderLevel: 150,
    unit: "pieces",
    expiryDate: "2026-09-01",
    batchNo: "CAN-2277",
    supplier: "BD Medical",
    unitCost: 12,
    movements: [
      { type: "received", qtyDelta: 500, performedBy: "Store Keeper · Ravi P.", when: "20 Jul, 09:00" },
      { type: "issued", qtyDelta: -160, performedBy: "Nurse Store · Kavita J.", when: "12 Aug, 10:15" },
    ],
  },
  {
    id: "inv-0008",
    itemRef: "INV-0008",
    name: "Ceftriaxone 1g Injection",
    category: "medicine",
    currentStock: 48,
    reorderLevel: 40,
    unit: "vials",
    expiryDate: "2026-11-12",
    batchNo: "CFX-1920",
    supplier: "Zydus Lifesciences",
    unitCost: 68,
    movements: [
      { type: "received", qtyDelta: 100, performedBy: "Store Keeper · Ravi P.", when: "2 Aug, 09:20" },
      { type: "issued", qtyDelta: -46, performedBy: "Pharmacist · Meena K.", when: "16 Aug, 14:10", note: "IPD orders" },
      { type: "issued", qtyDelta: -6, performedBy: "Pharmacist · Suresh N.", when: "17 Aug, 09:52" },
    ],
  },
  {
    id: "inv-0009",
    itemRef: "INV-0009",
    name: "Portable ECG Machine",
    category: "equipment",
    currentStock: 5,
    reorderLevel: 2,
    unit: "units",
    batchNo: "EQ-ECG-03",
    supplier: "GE Healthcare",
    unitCost: 185000,
    movements: [
      { type: "received", qtyDelta: 6, performedBy: "Biomedical Eng. · Farhan A.", when: "5 Feb, 11:00" },
      { type: "adjusted", qtyDelta: -1, performedBy: "Biomedical Eng. · Farhan A.", when: "22 Jun, 13:00", note: "1 unit written off — beyond repair" },
    ],
  },
  {
    id: "inv-0010",
    itemRef: "INV-0010",
    name: "Betadine Solution 500ml",
    category: "consumable",
    currentStock: 60,
    reorderLevel: 80,
    unit: "bottles",
    expiryDate: "2026-08-25",
    batchNo: "BTD-0741",
    supplier: "Win-Medicare",
    unitCost: 145,
    movements: [
      { type: "received", qtyDelta: 100, performedBy: "Store Keeper · Ravi P.", when: "15 Jun, 09:00" },
      { type: "issued", qtyDelta: -40, performedBy: "Nurse Store · Kavita J.", when: "10 Aug, 11:30" },
    ],
  },
  {
    id: "inv-0011",
    itemRef: "INV-0011",
    name: "Metformin 500mg",
    category: "medicine",
    currentStock: 950,
    reorderLevel: 300,
    unit: "tablets",
    expiryDate: "2027-02-10",
    batchNo: "MET-4410",
    supplier: "Cipla Ltd.",
    unitCost: 1.1,
    movements: [
      { type: "received", qtyDelta: 1000, performedBy: "Store Keeper · Ravi P.", when: "4 Aug, 09:15" },
      { type: "issued", qtyDelta: -50, performedBy: "Pharmacist · Meena K.", when: "17 Aug, 09:58" },
    ],
  },
  {
    id: "inv-0012",
    itemRef: "INV-0012",
    name: "Nebulizer Machine",
    category: "equipment",
    currentStock: 3,
    reorderLevel: 3,
    unit: "units",
    batchNo: "EQ-NEB-11",
    supplier: "Omron Healthcare",
    unitCost: 3200,
    movements: [
      { type: "received", qtyDelta: 4, performedBy: "Biomedical Eng. · Farhan A.", when: "1 Mar, 10:00" },
      { type: "adjusted", qtyDelta: -1, performedBy: "Biomedical Eng. · Farhan A.", when: "18 Jul, 09:00", note: "Sent for servicing" },
    ],
  },
  {
    id: "inv-0013",
    itemRef: "INV-0013",
    name: "Enoxaparin 40mg Injection",
    category: "medicine",
    currentStock: 0,
    reorderLevel: 25,
    unit: "syringes",
    expiryDate: "2026-12-01",
    batchNo: "ENX-0087",
    supplier: "Sanofi India",
    unitCost: 210,
    movements: [
      { type: "received", qtyDelta: 30, performedBy: "Store Keeper · Ravi P.", when: "20 Jun, 09:00" },
      { type: "issued", qtyDelta: -28, performedBy: "Pharmacist · Meena K.", when: "14 Aug, 09:20" },
      { type: "issued", qtyDelta: -2, performedBy: "Pharmacist · Suresh N.", when: "15 Aug, 09:32" },
    ],
  },
  {
    id: "inv-0014",
    itemRef: "INV-0014",
    name: "Face Shields",
    category: "consumable",
    currentStock: 610,
    reorderLevel: 150,
    unit: "pieces",
    expiryDate: "2029-01-01",
    batchNo: "FSH-3301",
    supplier: "3M India",
    unitCost: 22,
    movements: [
      { type: "received", qtyDelta: 800, performedBy: "Store Keeper · Ravi P.", when: "10 May, 09:00" },
      { type: "issued", qtyDelta: -190, performedBy: "Nurse Store · Kavita J.", when: "9 Aug, 10:00" },
    ],
  },
  {
    id: "inv-0015",
    itemRef: "INV-0015",
    name: "Defibrillator (AED)",
    category: "equipment",
    currentStock: 2,
    reorderLevel: 1,
    unit: "units",
    batchNo: "EQ-AED-02",
    supplier: "Philips Healthcare",
    unitCost: 250000,
    movements: [
      { type: "received", qtyDelta: 2, performedBy: "Biomedical Eng. · Farhan A.", when: "14 Jan, 09:00" },
    ],
  },
];
