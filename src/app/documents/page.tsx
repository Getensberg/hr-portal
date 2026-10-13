"use client";
import { useState } from "react";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Select } from "@/components/Select";
import styles from "./documents.module.css";

type DocFile = { url: string; name: string };

const NO_FOLDER = "Без категории";

// Тип файла по расширению: подпись и цвет плитки
function fileKind(name: string): { label: string; tint: string } {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  if (["xls", "xlsx", "csv"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintMint" };
  if (ext === "pdf") return { label: "PDF", tint: "tintRose" };
  if (["doc", "docx", "rtf", "txt"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintSky" };
  if (["ppt", "pptx"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintPeach" };
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintLilac" };
  if (["zip", "rar", "7z"].includes(ext)) return { label: ext.toUpperCase(), tint: "tintSand" };
  return { label: ext && ext.length <= 4 ? ext.toUpperCase() : "ФАЙЛ", tint: "tintGray" };
}

function FileRow({ file }: { file: DocFile }) {
  const kind = fileKind(file.name);
  return (
    <a href={file.url} target="_blank" rel="noopener noreferrer" className={styles.file} title={file.name}>
      <span className={`${styles.fileIcon} ${styles[kind.tint]}`}>{kind.label}</span>
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
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const categories = Array.from(
    new Set((items ?? []).map((i) => i.category).filter((c): c is string => Boolean(c)))
  );

  const filtered = (items ?? []).filter((item) => {
    const matchesCategory = !category || item.category === category;
    const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
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
  const searching = Boolean(search);

  return (
    <PageShell title="Документы">
      <div className={styles.controls}>
        <Select value={category} onChange={setCategory} ariaLabel="Категория" options={[{ value: "", label: "Все категории" }, ...categories.map((c) => ({ value: c, label: c }))]} />
        <input
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
        />
      </div>

      {isLoading && <p className="text-s">Загрузка...</p>}

      {folders.map(([folder, docs]) => {
        const isClosed = closed[folder] && !searching;
        return (
          <section key={folder} className={styles.folder}>
            <button
              type="button"
              className={styles.folderHead}
              onClick={() => setClosed((c) => ({ ...c, [folder]: !c[folder] }))}
              aria-expanded={!isClosed}
            >
              <span className={styles.folderIcon} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 7a2 2 0 0 1 2-2H10l2 2.5h6.5a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z" />
                </svg>
              </span>
              <span className={styles.folderTitle}>{folder}</span>
              <span className={styles.count}>{docs.length}</span>
              <svg className={`${styles.chevron} ${isClosed ? styles.chevronClosed : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {!isClosed && (
              <div className={styles.docs}>
                {docs.map((doc) => {
                  const files: DocFile[] = doc.files?.length
                    ? doc.files
                    : doc.fileUrl
                      ? [{ url: doc.fileUrl, name: doc.fileName || "Файл" }]
                      : [];
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
            )}
          </section>
        );
      })}
      {filtered.length === 0 && !isLoading && <p className="text-s">Ничего не найдено</p>}
    </PageShell>
  );
}
