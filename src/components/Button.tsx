import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? styles.primary : styles.secondary;
  return <button className={`${styles.btn} ${variantClass} ${className ?? ""}`} {...props} />;
}