"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import styles from "../login/login.module.css";

type Info = { valid: boolean; fullName?: string; email?: string };

function Form() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [info, setInfo] = useState<Info | null>(null);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => alive && setInfo(d))
      .catch(() => alive && setInfo({ valid: false }));
    return () => {
      alive = false;
    };
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Пароль должен быть не короче 8 символов");
    if (password !== repeat) return setError("Пароли не совпадают");
    setLoading(true);
    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Не удалось сохранить пароль");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Не удалось сохранить пароль. Проверьте соединение и попробуйте ещё раз");
      setLoading(false);
    }
  }

  return (
    <div className={styles.stage}>
      <span className={styles.decor1} />
      <span className={styles.decor2} />
      <form onSubmit={submit} className={styles.card} noValidate>
        <h1 className={styles.title}>Установка пароля</h1>

        {info === null && <p className={styles.subtitle}>Проверяем ссылку…</p>}

        {info && !info.valid && (
          <p className={styles.subtitle}>Ссылка недействительна или устарела. Попросите HR прислать новую.</p>
        )}

        {info?.valid && done && (
          <>
            <p className={styles.subtitle}>Пароль сохранён. Теперь можно войти.</p>
            <Button type="button" className={styles.submit} onClick={() => router.push("/login")}>Перейти ко входу</Button>
          </>
        )}

        {info?.valid && !done && (
          <>
            <p className={styles.subtitle}>{info.fullName}, придумайте пароль для входа ({info.email}).</p>
            <label className={styles.field}>
              <span className={styles.label}>Новый пароль</span>
              <input className="input" type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Не короче 8 символов" />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Повторите пароль</span>
              <input className="input" type="password" autoComplete="new-password" value={repeat} onChange={(e) => { setRepeat(e.target.value); setError(""); }} />
            </label>
            <FormError message={error} />
            <Button type="submit" disabled={loading} className={styles.submit}>Сохранить пароль</Button>
          </>
        )}
      </form>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <Form />
    </Suspense>
  );
}
