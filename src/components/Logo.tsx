import Link from "next/link";
import styles from "./Logo.module.css";

// Пока текстовый знак. Когда появится файл логотипа, его достаточно заменить здесь.
export function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="Magssory — на главную">
      Magssory
    </Link>
  );
}
