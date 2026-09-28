import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "md" | "sm";
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  const variantClass =
    variant === "primary" ? styles.primary : variant === "danger" ? styles.danger : styles.secondary;
  const sizeClass = size === "sm" ? styles.small : "";
  return <button className={`${styles.btn} ${variantClass} ${sizeClass} ${className ?? ""}`} {...props} />;
}