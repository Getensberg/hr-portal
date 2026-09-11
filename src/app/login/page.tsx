"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/Button";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setError("Неверный email или пароль");
    else window.location.href = "/";
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className="text-h1">Вход</h1>
      <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Пароль" />
      <Button type="submit">Войти</Button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}