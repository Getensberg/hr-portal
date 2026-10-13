import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "accent" | "light";
  size?: "md" | "sm";
};

const VARIANT_CLASS = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  accent: styles.accent,
  light: styles.light,
} as const;

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  const sizeClass = size === "sm" ? styles.small : "";
  return <button className={`${styles.btn} ${VARIANT_CLASS[variant]} ${sizeClass} ${className ?? ""}`} {...props} />;
}
