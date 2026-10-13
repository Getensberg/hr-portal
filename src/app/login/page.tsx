"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/Button";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Введите email и пароль");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (res?.error) {
        setError("Неверный email или пароль");
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Не удалось войти. Проверьте соединение и попробуйте ещё раз");
      setLoading(false);
    }
  }

  return (
    <div className={styles.stage}>
      <span className={styles.decor1} />
      <span className={styles.decor2} />

      <form onSubmit={handleSubmit} className={styles.card} noValidate>
        <span className={styles.icon} aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="9" rx="3" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <h1 className={styles.title}>Добро пожаловать</h1>
        <p className={styles.subtitle}>Войдите, чтобы открыть корпоративный портал Magssory</p>

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="name@company.ru"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Пароль</span>
          <span className={styles.passwordWrap}>
            <input
              className={`input ${styles.passwordInput}`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Введите пароль"
            />
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? "Скрыть" : "Показать"}
            </button>
          </span>
        </label>

        {error && <p role="alert" className={styles.error}>{error}</p>}

        <Button type="submit" variant="accent" className={styles.submit} disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </Button>

        <p className={styles.hint}>Нет доступа? Обратитесь в HR-отдел — аккаунты создают сотрудники отдела кадров.</p>
      </form>
    </div>
  );
}
