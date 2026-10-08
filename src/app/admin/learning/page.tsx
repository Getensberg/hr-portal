"use client";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGetLearningReportQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { EmployeeProgress } from "@/components/EmployeeProgress";
import styles from "./learning-report.module.css";

type Tab = "courses" | "tests" | "employees";

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

export default function AdminLearningReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data, isLoading } = useGetLearningReportQuery(undefined, { refetchOnMountOrArgChange: true });
  const [tab, setTab] = useState<Tab>("courses");
  const [openCourse, setOpenCourse] = useState<string | null>(null);

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN" || isLoading || !data) {
    return <p className="text-s">Загрузка...</p>;
  }

  const inReview = data.tests.reduce((sum, t) => sum + t.inReview, 0);

  return (
    <PageShell title="Отчёты по обучению" wide>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{data.courses.length}</div>
          <div className={styles.statLabel}>курсов в работе</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{data.tests.length}</div>
          <div className={styles.statLabel}>тестов с результатами</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNumber}>{inReview}</div>
          <div className={styles.statLabel}>ответов ждут проверки</div>
          {inReview > 0 && <Link className={styles.statLink} href="/admin/reviews">Перейти к проверке</Link>}
        </div>
      </div>

      <div className={styles.tabs}>
        {([["courses", "Курсы"], ["tests", "Тесты"], ["employees", "Сотрудники"]] as const).map(([value, label]) => (
          <Button key={value} size="sm" variant={tab === value ? "primary" : "secondary"} onClick={() => setTab(value)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "courses" && (
        data.courses.length === 0 ? (
          <p className={styles.empty}>Пока нет опубликованных курсов, которые кто-то видит.</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Курс</th>
                    <th>Доступ</th>
                    <th>Сотрудников</th>
                    <th>Не начали</th>
                    <th>В процессе</th>
                    <th>Прошли</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.map((c) => (
                    <Fragment key={c.id}>
                      <tr>
                        <td className={styles.title}>{c.title}</td>
                        <td>{c.restricted ? "По выдаче" : "Открыт всем"}</td>
                        <td>{c.audience}</td>
                        <td>
                          {c.notStarted > 0 ? (
                            <button
                              type="button"
                              className={styles.linkBtn}
                              onClick={() => setOpenCourse(openCourse === c.id ? null : c.id)}
                            >
                              {c.notStarted}
                            </button>
                          ) : 0}
                        </td>
                        <td>{c.inProgress}</td>
                        <td>{c.done} ({pct(c.done, c.audience)}%)</td>
                      </tr>
                      {openCourse === c.id && (
                        <tr>
                          <td colSpan={6} className={styles.expand}>
                            Не начали: {c.notStartedNames.join(", ")}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.hint}>
              «Сотрудников» это те, кто видит курс: для закрытого курса те, кому выдан доступ. HR-аккаунты в отчёт не входят.
            </p>
          </>
        )
      )}

      {tab === "tests" && (
        data.tests.length === 0 ? (
          <p className={styles.empty}>Пока нет опубликованных тестов с вопросами.</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Тест</th>
                    <th>Проходной балл</th>
                    <th>Участников</th>
                    <th>Попыток</th>
                    <th>Сдали</th>
                    <th>На проверке</th>
                    <th>Средний балл</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tests.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className={styles.title}>{t.title}</div>
                        {t.courseTitle && <div className={styles.sub}>Курс «{t.courseTitle}»</div>}
                      </td>
                      <td>{t.passingScore}%</td>
                      <td>{t.people}</td>
                      <td>{t.attempts}</td>
                      <td>{t.passedPeople} ({pct(t.passedPeople, t.people)}%)</td>
                      <td>{t.inReview}</td>
                      <td>{t.avgScore !== null ? `${t.avgScore}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.hint}>
              Средний балл считается по проверенным попыткам. Сотрудники свои баллы не видят, только статус.
            </p>
          </>
        )
      )}

      {tab === "employees" && <EmployeeProgress employees={data.employees} />}
    </PageShell>
  );
}