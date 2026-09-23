import styles from "./Footer.module.css";

const SOCIAL_LINKS = [
  { href: process.env.NEXT_PUBLIC_SOCIAL_VK_URL || "#", label: "VK" },
  { href: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM_URL || "#", label: "Telegram" },
  { href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL || "#", label: "Instagram" },
  { href: process.env.NEXT_PUBLIC_SOCIAL_WEBSITE_URL || "#", label: "Сайт компании" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        {SOCIAL_LINKS.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        ))}
      </div>
      <span className={styles.copy}>© {new Date().getFullYear()} HR-портал</span>
    </footer>
  );
}