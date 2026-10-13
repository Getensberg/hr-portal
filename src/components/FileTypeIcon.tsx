import styles from "./FileTypeIcon.module.css";

// Тип файла по расширению: подпись и цвет плитки
export function fileKind(name: string): { label: string; tint: string } {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  if (["xls", "xlsx", "csv"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintMint" };
  if (ext === "pdf") return { label: "PDF", tint: "tintRose" };
  if (["doc", "docx", "rtf", "txt"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintSky" };
  if (["ppt", "pptx"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintPeach" };
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintLilac" };
  if (["zip", "rar", "7z"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintSand" };
  return { label: ext && ext.length <= 4 ? ext.toUpperCase() : "ФАЙЛ", tint: "tintGray" };
}

export function FileTypeIcon({ name, size = 42 }: { name: string; size?: number }) {
  const kind = fileKind(name);
  return (
    <span
      className={`${styles.icon} ${styles[kind.tint]}`}
      style={{ width: size, height: size, fontSize: size >= 40 ? 11 : 9 }}
      aria-hidden="true"
    >
      {kind.label}
    </span>
  );
}
