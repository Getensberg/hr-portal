import styles from "./Card.module.css";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className ?? ""}`}>{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className={styles.cardTitle}>{children}</h3>;
}