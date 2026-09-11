import styles from "./PageShell.module.css";

export function PageShell({ title, wide, children }: { title?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`${styles.shell} ${wide ? styles.wide : ""}`}>
      {title && <h1 className={`${styles.pageTitle} text-h1`}>{title}</h1>}
      {children}
    </div>
  );
}