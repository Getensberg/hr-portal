"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  useGetContentQuery,
  useGetMyRequestsQuery,
  useGetLearningQuery,
  useGetMyVacationsQuery,
  useGetHolidaysQuery,
  useGetBlockedPeriodsQuery,
  useGetActiveSurveysQuery,
  type SurveyItem,
} from "@/store/api";
import { VACATION_LIMITS, daysInYearExcludingHolidays, todayKey, formatRu } from "@/lib/vacation";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { ProgressBar } from "@/components/ProgressBar";
import { NewsSlider } from "@/components/NewsSlider";
import buttonStyles from "@/components/Button.module.css";
import { NewRequestButton } from "@/components/NewRequestButton";
import { ImportantMark } from "@/components/ImportantMark";
import styles from "./home.module.css";

const CATEGORY_TINTS = ["tintLilac", "tintMint", "tintPeach", "tintSky"] as const;
const COURSE_COLORS = ["var(--color-accent)", "#3FAE7A", "#E58A5F"];

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function IconDoc() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 0 2 2h14" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  );
}

// Два последних опроса: одни и те же строки на телефоне и на десктопе
function SurveyRows({ items }: { items: SurveyItem[] }) {
  return (
    <div className={styles.surveyList}>
      {items.map((s) => {
        const done = Boolean(s.completed);
        const sub = s.isSuggestionBox
          ? "Идея или замечание"
          : `${s.isAnonymous ? "Анонимно" : "Опрос"} · вопросов: ${s.questions.length}`;
        return (
          <Link key={s.id} href="/surveys" className={`${styles.surveyRow} ${done ? styles.surveyDone : ""}`}>
            <span className={`${styles.surveyIcon} ${s.isSuggestionBox ? styles.tintSand : styles.tintLilac}`}>
              {s.isSuggestionBox ? <IconChat /> : <IconChart />}
            </span>
            <span className={styles.surveyBody}>
              <span className={styles.surveyTitle}>{s.title}</span>
              <span className={styles.surveyText}>{sub}</span>
            </span>
            <span className={styles.surveyCta}>{done ? "Пройден" : s.isSuggestionBox ? "Написать" : "Пройти"}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const skip = !session;

  const { data: news } = useGetContentQuery({ types: ["NEWS_POST", "KNOWLEDGE_ARTICLE"], limit: 6 }, { skip });
  const { data: requests } = useGetMyRequestsQuery(undefined, { skip });
  const { data: learning } = useGetLearningQuery(undefined, { skip });
  const { data: vacations } = useGetMyVacationsQuery(undefined, { skip });
  const { data: holidays } = useGetHolidaysQuery(undefined, { skip });
  const { data: surveys } = useGetActiveSurveysQuery(undefined, { skip });
  const { data: blocked } = useGetBlockedPeriodsQuery(undefined, { skip });

  // Вкладки блока слева: новости, документы, галерея. Документы и альбомы грузим, только когда вкладку открыли
  const [tab, setTab] = useState<"news" | "docs" | "gallery">("news");
  const { data: docs } = useGetContentQuery({ type: "POLICY_DOCUMENT", limit: 6 }, { skip: skip || tab !== "docs" });
  const { data: albums } = useGetContentQuery({ type: "GALLERY_ALBUM", limit: 6 }, { skip: skip || tab !== "gallery" });

  if (!session) {
    return (
      <div className={styles.pageWrap}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Magssory</h1>
          <p className={styles.heroDate}>Войдите, чтобы продолжить.</p>
          <div>
            <Link href="/login" className={`${buttonStyles.btn} ${buttonStyles.light}`}>
              Войти
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const firstName = session.user.name?.split(" ")[0] ?? "";
  const todayRaw = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);

  // Быстрые действия в синем блоке
  const activeRequests = (requests ?? []).filter((r) => r.status !== "DONE").length;

  const year = new Date().getFullYear();
  const holidaySet = new Set((holidays ?? []).map((h) => h.date.slice(0, 10)));
  const usedVacation = (vacations ?? [])
    .filter((e) => e.type === "VACATION")
    .reduce((sum, e) => sum + daysInYearExcludingHolidays(new Date(e.startDate), new Date(e.endDate), year, holidaySet), 0);
  const vacationLeft = Math.max(VACATION_LIMITS.VACATION - usedVacation, 0);

  // Ближайший отпуск: сегодняшний или первый из будущих
  const today0 = todayKey();
  const nextVacation = (vacations ?? [])
    .filter((e) => e.type === "VACATION" && e.endDate.slice(0, 10) >= today0)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const daysToVacation = nextVacation
    ? Math.round((Date.parse(nextVacation.startDate.slice(0, 10)) - Date.parse(today0)) / 86400000)
    : null;
  const vacationSub =
    daysToVacation === null
      ? `${vacationLeft} ${plural(vacationLeft, "день", "дня", "дней")} осталось`
      : daysToVacation <= 0
        ? "Сейчас в отпуске"
        : `Через ${daysToVacation} ${plural(daysToVacation, "день", "дня", "дней")} · осталось ${vacationLeft}`;

  // Ближайшие праздник и ограничение на отпуск
  const nextHoliday = [...(holidays ?? [])].filter((h) => h.date.slice(0, 10) >= today0).sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextBlocked = [...(blocked ?? [])].filter((x) => x.endDate.slice(0, 10) >= today0).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  // Опрос, который ещё не пройден, показываем крупно под приветствием
  const pendingSurvey = (surveys ?? []).find((x) => !x.completed && !x.isSuggestionBox);

  const courses = learning?.courses ?? [];
  const inProgress = courses.filter((c) => c.state === "IN_PROGRESS").length;
  const myCourses = [...courses]
    .filter((c) => c.state !== "COMPLETED")
    .sort((a, b) => Number(b.state === "IN_PROGRESS") - Number(a.state === "IN_PROGRESS"))
    .slice(0, 3)
    .map((c) => {
      const total = c.lessonsTotal + c.testsTotal;
      const done = c.lessonsDone + c.testsPassed;
      return { id: c.id, title: c.title, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
    });

  // Новости: на десктопе одна крупная и две малые, на телефоне карусель
  const featured = news?.[0];
  const rest = (news ?? []).slice(1, 3);
  const sliderItems = (news ?? []).slice(0, 5);

  // Два последних опроса (API отдаёт их от новых к старым)
  const latestSurveys = (surveys ?? []).slice(0, 2);

  return (
    <div className={styles.pageWrap}>
      {/* Синий блок: приветствие и быстрые действия */}
      <section className={styles.hero}>
        <div className={styles.heroDecor1} />
        <div className={styles.heroDecor2} />

        <div className={styles.heroTop}>
          <div>
            <div className={styles.heroDate}>{today}</div>
            <h1 className={styles.heroTitle}>Привет, {firstName}!</h1>
          </div>
          <NewRequestButton className={`${buttonStyles.btn} ${buttonStyles.light} ${styles.heroCta}`} />
        </div>

        <div className={styles.actions}>
          <Link href="/requests" className={styles.action}>
            <span className={`${styles.actionIcon} ${styles.tintLilac}`}>
              <IconDoc />
              {activeRequests > 0 && <span className={styles.actionBadge}>{activeRequests}</span>}
            </span>
            <span className={styles.actionText}>
              <span className={styles.actionTitle}>Заявки</span>
              <span className={styles.actionSub}>{activeRequests > 0 ? `${activeRequests} в работе` : "Справки, техника, доступы"}</span>
            </span>
          </Link>
          <Link href="/requests?view=calendar" className={styles.action}>
            <span className={`${styles.actionIcon} ${styles.tintMint}`}><IconCalendar /></span>
            <span className={styles.actionText}>
              <span className={styles.actionTitle}>Отпуск</span>
              <span className={styles.actionSub}>{vacationSub}</span>
            </span>
          </Link>
          <Link href="/learning" className={styles.action}>
            <span className={`${styles.actionIcon} ${styles.tintPeach}`}><IconBook /></span>
            <span className={styles.actionText}>
              <span className={styles.actionTitle}>Обучение</span>
              <span className={styles.actionSub}>
                {inProgress > 0 ? `${inProgress} ${plural(inProgress, "курс", "курса", "курсов")} в процессе` : "Курсы и тесты"}
              </span>
            </span>
          </Link>
        </div>
      </section>

      {(pendingSurvey || nextHoliday || nextBlocked) && (
        <section className={styles.infoRow}>
          {pendingSurvey && (
            <Link href="/surveys" className={styles.surveyBanner}>
              <span className={styles.bannerIcon}><IconChart /></span>
              <span className={styles.bannerBody}>
                <span className={styles.bannerTitle}>{pendingSurvey.title}</span>
                <span className={styles.bannerText}>{pendingSurvey.isAnonymous ? "Анонимный опрос" : "Опрос"} · вопросов: {pendingSurvey.questions.length}</span>
              </span>
              <span className={styles.bannerCta}>Пройти</span>
            </Link>
          )}
          {nextHoliday && (
            <Link href="/requests?view=calendar" className={`${styles.infoChip} ${styles.chipHoliday}`}>
              <span className={styles.infoLabel}>Ближайший праздник</span>
              <span className={styles.infoText}>{formatRu(nextHoliday.date)} · {nextHoliday.name}</span>
            </Link>
          )}
          {nextBlocked && (
            <Link href="/requests?view=calendar" className={`${styles.infoChip} ${styles.chipBlocked}`}>
              <span className={styles.infoLabel}>Отпуск не рекомендуется</span>
              <span className={styles.infoText}>{formatRu(nextBlocked.startDate)} – {formatRu(nextBlocked.endDate)} · {nextBlocked.reason}</span>
            </Link>
          )}
        </section>
      )}

      <section className={styles.columns}>
        {/* Новости */}
        <div className={styles.newsCol}>
          <div className={styles.colHeader}>
            <div className={styles.tabs} role="tablist">
              {([["news", "Новости"], ["docs", "Документы"], ["gallery", "Галерея"]] as const).map(([key, label]) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} className={`${styles.tab} ${tab === key ? styles.tabActive : ""}`} onClick={() => setTab(key)}>
                  {label}
                </button>
              ))}
            </div>
            <Link href={tab === "docs" ? "/documents" : tab === "gallery" ? "/gallery" : "/news"} className={styles.colLink}>
              {tab === "docs" ? "Все документы" : tab === "gallery" ? "Вся галерея" : "Все новости"}
            </Link>
          </div>

          {tab === "docs" && (
            <div className={styles.docList}>
              {(docs ?? []).map((d) => {
                const first = d.files?.[0] ?? (d.fileUrl ? { url: d.fileUrl, name: d.fileName || d.title } : null);
                const body = (
                  <>
                    <FileTypeIcon name={first?.name ?? d.title} />
                    <span className={styles.docBody}>
                      <span className={styles.docTitle}>{d.title}</span>
                      {d.category && <span className={styles.docMeta}>{d.category}</span>}
                    </span>
                  </>
                );
                return first ? (
                  <a key={d.id} href={first.url} target="_blank" rel="noopener noreferrer" className={styles.docRow}>{body}</a>
                ) : (
                  <Link key={d.id} href="/documents" className={styles.docRow}>{body}</Link>
                );
              })}
              {docs && docs.length === 0 && <div className={styles.emptyBox}>Пока нет документов</div>}
            </div>
          )}

          {tab === "gallery" && (
            <div className={styles.albumGrid}>
              {(albums ?? []).map((a) => (
                <a key={a.id} href={a.fileUrl ?? "/gallery"} target="_blank" rel="noopener noreferrer" className={styles.albumCard}>
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.imageUrl} alt="" className={styles.albumThumb} />
                  ) : (
                    <span className={styles.albumThumb} />
                  )}
                  <span className={styles.albumTitle}>{a.title}</span>
                </a>
              ))}
              {albums && albums.length === 0 && <div className={styles.emptyBox}>Пока нет альбомов</div>}
            </div>
          )}

          {tab === "news" && (<>
          {/* Десктоп */}
          <div className={styles.newsDesktop}>
            {featured ? (
              <Link href={`/news/${featured.id}`} className={`${styles.featured} ${featured.imageUrl ? styles.featuredImage : ""}`}>
                {featured.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.imageUrl} alt="" className={styles.featuredPhoto} />
                )}
                <span className={styles.featuredShade} />
                <span className={styles.featuredChip}>{featured.isImportant && <ImportantMark />}{featured.category || (featured.type === "NEWS_POST" ? "Новости" : "Статья")}</span>
                <span className={styles.featuredTitle}>{featured.title}</span>
                <span className={styles.featuredMeta}>{formatDay(featured.createdAt)}</span>
              </Link>
            ) : (
              <div className={styles.emptyBox}>Пока нет новостей</div>
            )}

            {rest.length > 0 && (
              <div className={styles.newsRow}>
                {rest.map((item, i) => (
                  <Link key={item.id} href={`/news/${item.id}`} className={styles.newsCard}>
                    <span className={`${styles.chip} ${styles[CATEGORY_TINTS[i % CATEGORY_TINTS.length]]}`}>
                      {item.isImportant && <ImportantMark />}
                      {item.category || (item.type === "NEWS_POST" ? "Новости" : "Статья")}
                    </span>
                    <span className={styles.newsTitle}>{item.title}</span>
                    <span className={styles.newsPreview}>{item.content}</span>
                    <span className={styles.newsDate}>{formatDay(item.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Телефон */}
          <div className={styles.newsMobile}>
            <NewsSlider items={sliderItems} />
          </div>
          </>)}
        </div>

        {/* Опросы на телефоне идут между новостями и курсами */}
        {latestSurveys.length > 0 && (
          <div className={styles.surveysMobile}>
            <div className={styles.colHeader}>
              <h2 className={styles.colTitle}>Опросы</h2>
              <Link href="/surveys" className={styles.colLink}>Все</Link>
            </div>
            <SurveyRows items={latestSurveys} />
          </div>
        )}

        <aside className={styles.sideCol}>
          <div className={styles.colHeader}>
            <h2 className={styles.colTitle}>Мои курсы</h2>
            <Link href="/learning" className={styles.colLink}>Все</Link>
          </div>

          <div className={styles.coursesCard}>
            {myCourses.length === 0 ? (
              <div className={styles.coursesEmpty}>
                <p>Пока нет курсов в процессе.</p>
                <Link href="/learning" className={styles.colLink}>Открыть обучение</Link>
              </div>
            ) : (
              myCourses.map((c, i) => (
                <Link key={c.id} href={`/learning/courses/${c.id}`} className={styles.courseRow}>
                  <span className={styles.courseHead}>
                    <span className={styles.courseTitle}>{c.title}</span>
                    <span className={styles.coursePercent}>{c.percent}%</span>
                  </span>
                  <ProgressBar percent={c.percent} color={COURSE_COLORS[i % COURSE_COLORS.length]} />
                </Link>
              ))
            )}
          </div>

          {/* Опросы на десктопе: под курсами */}
          {latestSurveys.length > 0 && (
            <div className={styles.surveysDesktop}>
              <SurveyRows items={latestSurveys} />
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
