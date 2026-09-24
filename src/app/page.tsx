"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useGetContentQuery } from "@/store/api";
import { Card, CardTitle } from "@/components/Card";
import { NewsCarousel } from "@/components/NewsCarousel";
import buttonStyles from "@/components/Button.module.css";
import styles from "./home.module.css";

const EMPLOYEE_TILES = [
  { href: "/requests", title: "Мои заявки", desc: "Справки, отпуска, техника и доступы" },
  { href: "/knowledge-base", title: "База знаний", desc: "Документы, регламенты, новости, галерея" },
  { href: "/surveys", title: "Опросы", desc: "Pulse-опросы и ящик предложений" },
  { href: "/onboarding", title: "Онбординг", desc: "Чек-лист задач и наставник" },
  { href: "/jobs", title: "Вакансии", desc: "Открытые позиции и рекомендации" },
  { href: "/profile", title: "Профиль", desc: "Личный кабинет и оргструктура компании" },
];


export default function HomePage() {
  const { data: session } = useSession();
  const { data: news } = useGetContentQuery({ types: ["NEWS_POST", "KNOWLEDGE_ARTICLE"], limit: 6 }, { skip: !session });

  if (!session) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.hero}>
          <h1 className="text-hero">HR-портал</h1>
          <p className={styles.heroText}>Войдите, чтобы продолжить.</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <Link href="/login" className={`${buttonStyles.btn} ${buttonStyles.primary}`}>
            Войти
          </Link>
        </div>
      </div>
    );
  }

  const firstName = session.user.name?.split(" ")[0] ?? "";

  return (
    <div className={styles.pageWrap}>
      <div className={styles.hero}>
        <h1 className="text-hero">Привет, {firstName}!</h1>
        <p className={styles.heroText}>
          Добро пожаловать на HR-портал. Здесь можно подать заявку на справку или отпуск,
          пройти опрос, посмотреть новости компании и найти нужную информацию в базе знаний —
          всё в одном месте.
        </p>
      </div>

      <section className={styles.newsSection}>
        <div className={styles.newsSectionHeader}>
          <h2 className="text-h2">Новости компании</h2>
          <Link href="/news" className={`${buttonStyles.btn} ${buttonStyles.secondary}`}>
            Все новости →
          </Link>
        </div>
        <p className={`${styles.newsIntro} text-s`}>
          Наши последние новости — если хочется прочитать больше, переходите в общий список.
        </p>
        <NewsCarousel items={news ?? []} />
      </section>

      <section>
        <h3 className={`${styles.tilesHeading} text-h4`}>Разделы портала</h3>
        <div className={styles.grid}>
          {EMPLOYEE_TILES.map((t) => (
            <Link key={t.href} href={t.href} className={styles.tileLink}>
              <Card>
                <CardTitle>{t.title}</CardTitle>
                <p className="text-xs">{t.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}