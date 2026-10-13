"use client";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./Select.module.css";

export type SelectOption = { value: string; label: string };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  size?: "md" | "sm";
  className?: string;
  disabled?: boolean;
};

// Выпадающий список: на компьютере — меню под полем, на телефоне — панель снизу экрана
export function Select({ value, onChange, options, placeholder = "Выбрать", ariaLabel, size = "md", className, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);

    // На телефоне панель закрывает экран: страницу под ней не прокручиваем
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const prevOverflow = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Выбранный пункт показываем в поле зрения при открытии
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open]);

  function openList() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if ((e.key === "Enter" || e.key === " ") && active >= 0) {
      e.preventDefault();
      pick(options[active].value);
    }
  }

  return (
    <div ref={rootRef} className={`${styles.root} ${className ?? ""}`} onKeyDown={onKeyDown}>
      <button
        type="button"
        className={`input ${styles.trigger} ${size === "sm" ? styles.sm : ""} ${open ? styles.triggerOpen : ""}`}
        onClick={() => (open ? setOpen(false) : openList())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
      >
        <span className={selected ? styles.value : styles.placeholder}>{selected ? selected.label : placeholder}</span>
        <svg className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel} ref={listRef}>
            <div className={styles.handle} aria-hidden="true" />
            {(ariaLabel || placeholder) && <div className={styles.sheetTitle}>{ariaLabel ?? placeholder}</div>}
            <div id={listId} role="listbox" className={styles.list}>
              {options.map((o, i) => (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className={`${styles.option} ${o.value === value ? styles.optionSelected : ""} ${i === active ? styles.optionActive : ""}`}
                  onClick={() => pick(o.value)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span>{o.label}</span>
                  {o.value === value && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
