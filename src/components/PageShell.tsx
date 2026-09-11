import styles from "./PageShell.module.css";

export function PageShell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      {title && <h1 className={`${styles.pageTitle} text-h1`}>{title}</h1>}
      {children}
    </div>
  );
}