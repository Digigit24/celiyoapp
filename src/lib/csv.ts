/** Client-side CSV → OS share sheet, mobile's equivalent of a browser "download". */
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function exportCsvAndShare<T>(
  filename: string,
  rows: T[],
  columns: Array<{ header: string; value: (row: T) => unknown }>
) {
  const header = columns.map((c) => csvEscape(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => csvEscape(c.value(row))).join(",")).join("\n");
  const csv = `${header}\n${body}`;

  const destination = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(destination, csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device");
  }
  await Sharing.shareAsync(destination, { mimeType: "text/csv", UTI: "public.comma-separated-values-text" });
}
