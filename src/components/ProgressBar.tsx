import styles from "./ProgressBar.module.css";

export function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div className={styles.track} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={styles.fill} style={{ width: `${value}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}
