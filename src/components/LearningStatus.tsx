import styles from "./LearningStatus.module.css";

export type StatusKey = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "IN_REVIEW" | "FAILED";

const LABELS: Record<"course" | "test", Record<StatusKey, string>> = {
  course: { NOT_STARTED: "Не начат", IN_PROGRESS: "В процессе", DONE: "Пройден", IN_REVIEW: "На проверке", FAILED: "Не сдан" },
  test: { NOT_STARTED: "Не начат", IN_PROGRESS: "В процессе", DONE: "Сдан", IN_REVIEW: "На проверке", FAILED: "Не сдан" },
};

export function testStatusKey(state: string): StatusKey {
  if (state === "PASSED") return "DONE";
  if (state === "IN_REVIEW") return "IN_REVIEW";
  if (state === "FAILED") return "FAILED";
  return "NOT_STARTED";
}

export function StatusPill({ status, kind }: { status: StatusKey; kind: "course" | "test" }) {
  return <span className={`${styles.pill} ${styles[status]}`}>{LABELS[kind][status]}</span>;
}