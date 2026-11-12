"use client";
import { useState } from "react";
import { RequestModal } from "@/components/RequestModal";

type Props = {
  className?: string;
  children?: React.ReactNode;
  initialType?: string;
  initialValues?: Record<string, string>;
};

// Кнопка «Создать заявку»: открывает форму в окне, без перехода на другую страницу
export function NewRequestButton({ className, children = "Создать заявку", initialType, initialValues }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      <RequestModal open={open} onClose={() => setOpen(false)} initialType={initialType} initialValues={initialValues} />
    </>
  );
}
