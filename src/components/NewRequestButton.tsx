"use client";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { RequestForm } from "@/components/RequestForm";

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
      <Modal open={open} onClose={() => setOpen(false)} title="Новая заявка">
        <RequestForm initialType={initialType} initialValues={initialValues} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
