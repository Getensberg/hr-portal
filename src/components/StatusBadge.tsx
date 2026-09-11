import styles from "./StatusBadge.module.css";

const LABELS: Record<string, string> = {
  PENDING: "На рассмотрении",
  IN_PROGRESS: "В работе",
  DONE: "Готово",
};
const CLASS: Record<string, string> = {
  PENDING: styles.pending,
  IN_PROGRESS: styles.inProgress,
  DONE: styles.done,
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`${styles.badge} ${CLASS[status] ?? ""}`}>{LABELS[status] ?? status}</span>;
}