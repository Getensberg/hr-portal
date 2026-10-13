"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "./Logo";
import buttonStyles from "./Button.module.css";
import styles from "./Nav.module.css";

type NavLink = { href: string; label: string };

// Основные разделы: всегда на виду
const PRIMARY_LINKS: NavLink[] = [
  { href: "/", label: "Главная" },
  { href: "/learning", label: "Обучение" },
  { href: "/requests", label: "Заявки" },
  { href: "/calendar", label: "Календарь" },
  { href: "/knowledge-base", label: "База знаний" },
];

// Остальное прячем в «Ещё», чтобы шапка не разрасталась
const MORE_LINKS: NavLink[] = [
  { href: "/surveys", label: "Опросы" },
  { href: "/onboarding", label: "Онбординг" },
  { href: "/jobs", label: "Вакансии" },
  { href: "/profile", label: "Профиль" },
];

// Админские разделы сгруппированы по смыслу
const ADMIN_GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "Люди и контент",
    links: [
      { href: "/admin/users", label: "Сотрудники" },
      { href: "/admin/org", label: "Оргструктура" },
      { href: "/admin/content", label: "Контент" },
      { href: "/admin/jobs", label: "Вакансии" },
    ],
  },
  {
    title: "Обучение",
    links: [
      { href: "/admin/courses", label: "Курсы" },
      { href: "/admin/tests", label: "Тесты" },
      { href: "/admin/reviews", label: "Проверка" },
      { href: "/admin/learning", label: "Отчёты" },
    ],
  },
  {
    title: "Процессы",
    links: [
      { href: "/admin/requests", label: "Заявки" },
      { href: "/admin/calendar", label: "Календарь" },
      { href: "/admin/surveys", label: "Опросы" },
      { href: "/admin/onboarding", label: "Онбординг" },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Сотрудник",
  MANAGER: "Руководитель",
  HR_ADMIN: "HR",
};

type MenuKey = "more" | "admin" | "user" | null;

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Nav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menu, setMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  // Закрываем меню при переходе на другую страницу
  useEffect(() => {
    setMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Закрываем по клику снаружи и по Escape
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenu(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (status === "loading") return null;

  function isActive(href: string) {
    if (href === "/" || href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkClass(href: string) {
    return `${styles.link} ${isActive(href) ? styles.linkActive : ""}`;
  }

  if (!session) {
    return (
      <header className={styles.header}>
        <div className={styles.inner}>
          <Logo />
          <span className={styles.spacer} />
          <Link href="/login" className={`${buttonStyles.btn} ${buttonStyles.primary} ${buttonStyles.small}`}>
            Войти
          </Link>
        </div>
      </header>
    );
  }

  const role = session.user.role;
  const isAdmin = role === "HR_ADMIN";
  const isManager = role === "MANAGER";
  const moreActive = MORE_LINKS.some((l) => isActive(l.href));
  const adminActive = pathname.startsWith("/admin");
  const toggle = (key: Exclude<MenuKey, null>) => setMenu((m) => (m === key ? null : key));

  return (
    <header className={styles.header}>
      <nav className={styles.inner} ref={rootRef} aria-label="Основная навигация">
        <Logo />

        {/* Десктопное меню */}
        <div className={styles.desktopLinks}>
          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}

          <div className={styles.dropdown}>
            <button
              type="button"
              className={`${styles.link} ${styles.dropBtn} ${moreActive ? styles.linkActive : ""}`}
              aria-expanded={menu === "more"}
              onClick={() => toggle("more")}
            >
              Ещё <span className={styles.caret} aria-hidden="true">▾</span>
            </button>
            {menu === "more" && (
              <div className={styles.menu}>
                {MORE_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className={`${styles.menuItem} ${isActive(l.href) ? styles.menuItemActive : ""}`}>
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {isManager && (
            <Link href="/manager" className={linkClass("/manager")}>
              Моя команда
            </Link>
          )}

          {isAdmin && (
            <div className={styles.dropdown}>
              <button
                type="button"
                className={`${styles.link} ${styles.dropBtn} ${adminActive ? styles.linkActive : ""}`}
                aria-expanded={menu === "admin"}
                onClick={() => toggle("admin")}
              >
                Управление <span className={styles.caret} aria-hidden="true">▾</span>
              </button>
              {menu === "admin" && (
                <div className={`${styles.menu} ${styles.menuWide}`}>
                  <Link href="/admin" className={`${styles.menuItem} ${styles.menuAll} ${isActive("/admin") ? styles.menuItemActive : ""}`}>
                    Обзор админки
                  </Link>
                  {ADMIN_GROUPS.map((g) => (
                    <div key={g.title} className={styles.group}>
                      <div className={styles.groupTitle}>{g.title}</div>
                      {g.links.map((l) => (
                        <Link key={l.href} href={l.href} className={`${styles.menuItem} ${isActive(l.href) ? styles.menuItemActive : ""}`}>
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <span className={styles.spacer} />

        {/* Меню пользователя */}
        <div className={`${styles.dropdown} ${styles.userDrop}`}>
          <button
            type="button"
            className={styles.avatar}
            aria-label="Меню пользователя"
            aria-expanded={menu === "user"}
            onClick={() => toggle("user")}
          >
            {initials(session.user.name)}
          </button>
          {menu === "user" && (
            <div className={`${styles.menu} ${styles.menuRight}`}>
              <div className={styles.userBlock}>
                <div className={styles.userName}>{session.user.name}</div>
                <div className={styles.userRole}>{ROLE_LABELS[role] ?? role}</div>
              </div>
              <Link href="/profile" className={styles.menuItem}>Профиль</Link>
              <button type="button" className={`${styles.menuItem} ${styles.menuButton}`} onClick={() => signOut({ callbackUrl: "/login" })}>
                Выйти
              </button>
            </div>
          )}
        </div>

        {/* Бургер для телефона */}
        <button
          type="button"
          className={styles.burger}
          aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className={`${styles.burgerLines} ${mobileOpen ? styles.burgerOpen : ""}`} />
        </button>
      </nav>

      {/* Мобильная панель */}
      {mobileOpen && (
        <div className={styles.mobilePanel}>
          <div className={styles.mobileSection}>
            {[...PRIMARY_LINKS, ...MORE_LINKS].map((l) => (
              <Link key={l.href} href={l.href} className={`${styles.mobileLink} ${isActive(l.href) ? styles.mobileLinkActive : ""}`}>
                {l.label}
              </Link>
            ))}
            {isManager && (
              <Link href="/manager" className={`${styles.mobileLink} ${isActive("/manager") ? styles.mobileLinkActive : ""}`}>
                Моя команда
              </Link>
            )}
          </div>

          {isAdmin && (
            <>
              <Link href="/admin" className={`${styles.mobileLink} ${styles.mobileAll} ${isActive("/admin") ? styles.mobileLinkActive : ""}`}>
                Обзор админки
              </Link>
              {ADMIN_GROUPS.map((g) => (
                <div key={g.title} className={styles.mobileSection}>
                  <div className={styles.groupTitle}>{g.title}</div>
                  {g.links.map((l) => (
                    <Link key={l.href} href={l.href} className={`${styles.mobileLink} ${isActive(l.href) ? styles.mobileLinkActive : ""}`}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              ))}
            </>
          )}

          <div className={styles.mobileUser}>
            <div>
              <div className={styles.userName}>{session.user.name}</div>
              <div className={styles.userRole}>{ROLE_LABELS[role] ?? role}</div>
            </div>
            <button type="button" className={`${buttonStyles.btn} ${buttonStyles.secondary} ${buttonStyles.small}`} onClick={() => signOut({ callbackUrl: "/login" })}>
              Выйти
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
