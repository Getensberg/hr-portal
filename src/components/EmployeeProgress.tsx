"use client";
import { useState } from "react";
import type { ReportEmployee } from "@/store/api";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";
import { StatusPill } from "./LearningStatus";
import styles from "./EmployeeProgress.module.css";

function summarize(e: ReportEmployee) {
  const courses = e.items.filter((i) => i.kind === "course");
  const tests = e.items.filter((i) => i.kind === "test");
  return {
    coursesDone: courses.filter((i) => i.state === "DONE").length,
    coursesTotal: courses.length,
    testsDone: tests.filter((i) => i.state === "DONE").length,
    testsTotal: tests.length,
    inReview: tests.filter((i) => i.state === "IN_REVIEW").length,
  };
}

export function EmployeeProgress({ employees }: { employees: ReportEmployee[] }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter((d): d is string => Boolean(d)))
  ).sort();

  const q = search.trim().toLowerCase();
  const list = employees.filter(
    (e) => (!department || e.department === department) && (!q || e.fullName.toLowerCase().includes(q))
  );

  return (
    <>
      <div className={styles.filters}>
        <input
          className={`input ${styles.search}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени"
        />
        {departments.length > 1 && (
          <select className={`input ${styles.select}`} value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Все отделы</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {list.map((e) => {
        const s = summarize(e);
        const open = openId === e.id;
        return (
          <div key={e.id} className={styles.row}>
            <div className={styles.head}>
              <div>
                <div className={styles.name}>{e.fullName}</div>
                <div className={styles.meta}>
                  {[e.position, e.department].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div className={styles.headRight}>
                <div className={styles.summary}>
                  <span>Курсы: {s.coursesDone} из {s.coursesTotal}</span>
                  <span>Тесты: {s.testsDone} из {s.testsTotal}</span>
                  {s.inReview > 0 && <span className={styles.review}>На проверке: {s.inReview}</span>}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={e.items.length === 0}
                  onClick={() => setOpenId(open ? null : e.id)}
                >
                  {open ? "Свернуть" : "Подробнее"}
                </Button>
              </div>
            </div>

            {open && (
              <div className={styles.details}>
                {e.items.map((i) => (
                  <div key={`${i.kind}-${i.id}`} className={styles.item}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemTitle}>{i.title}</div>
                      <div className={styles.itemMeta}>
                        {i.kind === "course" ? "Курс" : i.courseTitle ? `Тест · в курсе «${i.courseTitle}»` : "Тест"}
                      </div>
                    </div>
                    <div className={styles.itemRight}>
                      {i.percent !== null && (
                        <>
                          <div className={styles.bar}><ProgressBar percent={i.percent} /></div>
                          <span className={styles.percent}>{i.percent}%</span>
                        </>
                      )}
                      <StatusPill status={i.state} kind={i.kind} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {list.length === 0 && (
        <p className={styles.empty}>
          {employees.length === 0 ? "Сотрудников пока нет" : "По выбранным фильтрам никого не найдено"}
        </p>
      )}
    </>
  );
}