"use client";
import { useState } from "react";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Select } from "@/components/Select";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import styles from "./documents.module.css";

type DocFile = { url: string; name: string };

const NO_FOLDER = "Без категории";

function docFiles(item: { files?: DocFile[] | null; fileUrl?: string | null; fileName?: string | null }): DocFile[] {
  if (item.files?.length) return item.files;
  return item.fileUrl ? [{ url: item.fileUrl, name: item.fileName || "Файл" }] : [];
}

function FolderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 7a2 2 0 0 1 2-2H10l2 2.5h6.5a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function FileRow({ file }: { file: DocFile }) {
  return (
    <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.file} title={file.name}>
      <FileTypeIcon name={file.name} />
      <span className={styles.fileName}>{file.name}</span>
      <svg className={styles.fileArrow} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
      </svg>
    </a>
  );
}

export default function DocumentsPage() {
  const { data: items, isLoading } = useGetContentQuery({ type: "POLICY_DOCUMENT" });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [activeFolder, setActiveFolder] = useState(""); // компьютер: выбранная папка в списке слева
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({}); // телефон: развёрнутые папки

  const categories = Array.from(
    new Set((items ?? []).map((i) => i.category).filter((c): c is string => Boolean(c)))
  );

  const q = search.trim().toLowerCase();
  const filtered = (items ?? []).filter((item) => {
    const matchesCategory = !category || item.category === category;
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.category ?? "").toLowerCase().includes(q) ||
      docFiles(item).some((f) => f.name.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((item) => {
    const folder = item.category || NO_FOLDER;
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(item);
  });
  // «Без категории» всегда в конце
  const folders = Object.entries(grouped).sort(([a], [b]) => (a === NO_FOLDER ? 1 : b === NO_FOLDER ? -1 : a.localeCompare(b, "ru")));
  const selected = activeFolder && grouped[activeFolder] ? activeFolder : "";
  const shown = selected ? folders.filter(([name]) => name === selected) : folders;
  const searching = Boolean(q);

  return (
    <PageShell title="Документы">
      <div className={styles.controls}>
        <Select value={category} onChange={setCategory} ariaLabel="Категория" options={[{ value: "", label: "Все категории" }, ...categories.map((c) => ({ value: c, label: c }))]} />
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по документам, папкам и файлам"
          aria-label="Поиск"
        />
      </div>

      {isLoading && <p className="text-s">Загрузка...</p>}

      <div className={styles.layout}>
        {/* Компьютер: список папок слева */}
        {folders.length > 0 && (
          <nav className={styles.side} aria-label="Папки">
            <button
              type="button"
              className={`${styles.sideItem} ${!selected ? styles.sideActive : ""}`}
              onClick={() => setActiveFolder("")}
            >
              <span className={styles.sideName}>Все документы</span>
              <span className={styles.sideCount}>{filtered.length}</span>
            </button>
            {folders.map(([name, docs]) => (
              <button
                key={name}
                type="button"
                className={`${styles.sideItem} ${selected === name ? styles.sideActive : ""}`}
                onClick={() => setActiveFolder(name)}
              >
                <span className={styles.sideIcon}><FolderIcon /></span>
                <span className={styles.sideName}>{name}</span>
                <span className={styles.sideCount}>{docs.length}</span>
              </button>
            ))}
          </nav>
        )}

        <div className={styles.folders}>
          {shown.map(([folder, docs]) => {
            const open = Boolean(openFolders[folder]) || searching;
            return (
              <section key={folder} className={styles.folder}>
                <button
                  type="button"
                  className={styles.folderHead}
                  onClick={() => setOpenFolders((o) => ({ ...o, [folder]: !o[folder] }))}
                  aria-expanded={open}
                >
                  <span className={styles.folderIcon}><FolderIcon /></span>
                  <span className={styles.folderTitle}>{folder}</span>
                  <span className={styles.count}>{docs.length}</span>
                  <svg className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <div className={`${styles.docs} ${open ? "" : styles.docsCollapsed}`}>
                  {docs.map((doc) => {
                    const files = docFiles(doc);
                    return (
                      <article key={doc.id} className={styles.doc}>
                        <h3 className={styles.docTitle}>{doc.title}</h3>
                        {files.length > 0 ? (
                          <div className={styles.files}>
                            {files.map((f, i) => <FileRow key={i} file={f} />)}
                          </div>
                        ) : (
                          <p className={styles.noFile}>Файл не приложен</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && !isLoading && <p className="text-s">Ничего не найдено</p>}
    </PageShell>
  );
}
