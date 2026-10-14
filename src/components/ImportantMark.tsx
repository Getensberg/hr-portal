import styles from "./ImportantMark.module.css";

/** Пометка «Важное» для новости: стоит перед категорией внутри плашки */
export function ImportantMark() {
  return <span className={styles.mark}>Важное</span>;
}
