"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetContentQuery,
  useCreateContentMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
  useUploadFileMutation,
  type ContentItem,
} from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { AttachButton } from "@/components/AttachButton";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { FormError } from "@/components/FormError";
import { getErrorMessage } from "@/lib/errors";
import styles from "./content-admin.module.css";

type Tab = "news" | "docs" | "gallery";
type DocFile = { url: string; name: string };

const TABS: { key: Tab; label: string; types: string[]; add: string }[] = [
  { key: "news", label: "Новости и статьи", types: ["NEWS_POST", "KNOWLEDGE_ARTICLE"], add: "Добавить новость" },
  { key: "docs", label: "Документы", types: ["POLICY_DOCUMENT"], add: "Добавить документ" },
  { key: "gallery", label: "Галерея", types: ["GALLERY_ALBUM"], add: "Добавить альбом" },
];
const NEWS_TYPE_OPTIONS = [
  { value: "NEWS_POST", label: "Новость" },
  { value: "KNOWLEDGE_ARTICLE", label: "Статья" },
];
const NO_FOLDER = "Без папки";

function itemFiles(item: ContentItem): DocFile[] {
  if (item.files?.length) return item.files;
  return item.fileUrl ? [{ url: item.fileUrl, name: item.fileName || "Файл" }] : [];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "HR_ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const { data: items } = useGetContentQuery({});
  const [createContent] = useCreateContentMutation();
  const [updateContent] = useUpdateContentMutation();
  const [deleteContent] = useDeleteContentMutation();
  const [uploadFile] = useUploadFileMutation();

  const [tab, setTab] = useState<Tab>("news");
  const [query, setQuery] = useState("");
  const [closedFolders, setClosedFolders] = useState<Record<string, boolean>>({});
  const [pageError, setPageError] = useState("");

  // Редактор: null — закрыт; id === null — создание новой записи
  const [editor, setEditor] = useState<{ id: string | null } | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newsType, setNewsType] = useState("NEWS_POST");
  const [category, setCategory] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [driveLink, setDriveLink] = useState("");
  const [existingFiles, setExistingFiles] = useState<DocFile[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [attachment, setAttachment] = useState<DocFile | null>(null);
  const [newAttachment, setNewAttachment] = useState<File[]>([]);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const currentTab = TABS.find((t) => t.key === tab)!;

  const tabItems = useMemo(
    () => (items ?? []).filter((i) => currentTab.types.includes(i.type)),
    [items, currentTab]
  );
  const counts = useMemo(() => {
    const result: Record<Tab, number> = { news: 0, docs: 0, gallery: 0 };
    for (const t of TABS) result[t.key] = (items ?? []).filter((i) => t.types.includes(i.type)).length;
    return result;
  }, [items]);

  const q = query.trim().toLowerCase();
  const visible = tabItems.filter(
    (i) =>
      !q ||
      i.title.toLowerCase().includes(q) ||
      (i.category ?? "").toLowerCase().includes(q) ||
      itemFiles(i).some((f) => f.name.toLowerCase().includes(q))
  );

  const folderNames = Array.from(new Set(tabItems.map((i) => i.category).filter((c): c is string => Boolean(c)))).sort((a, b) =>
    a.localeCompare(b, "ru")
  );

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  function openEditor(item?: ContentItem, presetCategory?: string) {
    setError("");
    setPageError("");
    setTitle(item?.title ?? "");
    setContent(item?.content ?? "");
    setNewsType(item && item.type === "KNOWLEDGE_ARTICLE" ? "KNOWLEDGE_ARTICLE" : "NEWS_POST");
    setCategory(item?.category ?? presetCategory ?? "");
    setIsImportant(Boolean(item?.isImportant));
    setDriveLink(item && item.type === "GALLERY_ALBUM" ? item.fileUrl ?? "" : "");
    setExistingFiles(item && item.type === "POLICY_DOCUMENT" ? itemFiles(item) : []);
    setNewFiles([]);
    setAttachment(item && item.type !== "POLICY_DOCUMENT" && item.type !== "GALLERY_ALBUM" && item.fileUrl ? { url: item.fileUrl, name: item.fileName || "Файл" } : null);
    setNewAttachment([]);
    setExistingImage(item?.imageUrl || null);
    setNewImage([]);
    setEditor({ id: item?.id ?? null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeEditor() {
    setEditor(null);
    setError("");
  }

  async function upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return uploadFile(formData).unwrap();
  }

  async function save() {
    if (!editor) return;
    if (!title.trim()) throw new Error("Укажите заголовок");
    if (tab === "gallery" && !driveLink.trim()) throw new Error("Укажите ссылку на папку в Google Drive");

    const type = tab === "news" ? newsType : tab === "docs" ? "POLICY_DOCUMENT" : "GALLERY_ALBUM";
    const body: Partial<ContentItem> = { title: title.trim(), content, type: type as ContentItem["type"], category: category.trim() || null };
    if (tab === "news") body.isImportant = isImportant;

    if (tab === "docs") {
      const uploaded: DocFile[] = [];
      for (const f of newFiles) {
        const u = await upload(f);
        uploaded.push({ url: u.url, name: u.name });
      }
      body.files = [...existingFiles, ...uploaded];
      // старое одиночное вложение заменяется списком файлов
      body.fileUrl = "";
      body.fileName = "";
    } else if (tab === "gallery") {
      body.fileUrl = driveLink.trim();
      body.fileName = "Google Drive";
    } else if (newAttachment[0]) {
      const u = await upload(newAttachment[0]);
      body.fileUrl = u.url;
      body.fileName = u.name;
    } else if (attachment) {
      body.fileUrl = attachment.url;
      body.fileName = attachment.name;
    } else {
      body.fileUrl = "";
      body.fileName = "";
    }

    if (tab !== "docs") {
      if (newImage[0]) body.imageUrl = (await upload(newImage[0])).url;
      else body.imageUrl = existingImage ?? (editor.id ? "" : undefined);
    }

    if (editor.id) await updateContent({ id: editor.id, ...body }).unwrap();
    else await createContent(body).unwrap();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await save();
      setEditor(null);
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось сохранить"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: ContentItem) {
    if (!confirm(`Удалить «${item.title}»? Это действие нельзя отменить.`)) return;
    setPageError("");
    try {
      await deleteContent(item.id).unwrap();
      if (editor?.id === item.id) setEditor(null);
    } catch (err) {
      setPageError(getErrorMessage(err, "Не удалось удалить"));
    }
  }

  const actions = (item: ContentItem) => (
    <div className={styles.itemActions}>
      <Button size="sm" variant="secondary" onClick={() => openEditor(item)}>Изменить</Button>
      <Button size="sm" variant="danger" onClick={() => handleDelete(item)}>Удалить</Button>
    </div>
  );

  // ---------- Списки по вкладкам ----------
  function renderNews() {
    return (
      <div className={styles.list}>
        {visible.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.thumb}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" />
              ) : (
                <span>{item.type === "NEWS_POST" ? "N" : "A"}</span>
              )}
            </div>
            <div className={styles.itemBody}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.meta}>
                {item.isImportant && <span className={`${styles.chip} ${styles.chipImportant}`}>Важное</span>}
                <span className={styles.chip}>{item.type === "NEWS_POST" ? "Новость" : "Статья"}</span>
                {item.category && <span>{item.category}</span>}
                <span>{formatDate(item.createdAt)}</span>
                {item.fileUrl && <span>Есть вложение</span>}
              </div>
            </div>
            {actions(item)}
          </div>
        ))}
      </div>
    );
  }

  function renderDocs() {
    const grouped: Record<string, ContentItem[]> = {};
    for (const item of visible) {
      const folder = item.category || NO_FOLDER;
      (grouped[folder] ??= []).push(item);
    }
    const folders = Object.entries(grouped).sort(([a], [b]) => (a === NO_FOLDER ? 1 : b === NO_FOLDER ? -1 : a.localeCompare(b, "ru")));
    return (
      <div className={styles.folders}>
        {folders.map(([folder, docs]) => {
          const closed = closedFolders[folder] && !q;
          return (
            <section key={folder} className={styles.folder}>
              <div className={styles.folderHead}>
                <button
                  type="button"
                  className={styles.folderToggle}
                  onClick={() => setClosedFolders((c) => ({ ...c, [folder]: !c[folder] }))}
                  aria-expanded={!closed}
                >
                  <span className={styles.folderIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 7a2 2 0 0 1 2-2H10l2 2.5h6.5a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7Z" />
                    </svg>
                  </span>
                  <span className={styles.folderTitle}>{folder}</span>
                  <span className={styles.count}>{docs.length}</span>
                  <svg className={`${styles.chevron} ${closed ? styles.chevronClosed : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <Button size="sm" variant="secondary" onClick={() => openEditor(undefined, folder === NO_FOLDER ? "" : folder)}>
                  + Документ
                </Button>
              </div>
              {!closed && (
                <div className={styles.docs}>
                  {docs.map((doc) => {
                    const files = itemFiles(doc);
                    return (
                      <div key={doc.id} className={styles.doc}>
                        <div className={styles.docTop}>
                          <div className={styles.itemTitle}>{doc.title}</div>
                          {actions(doc)}
                        </div>
                        {files.length > 0 ? (
                          <div className={styles.fileChips}>
                            {files.map((f, i) => (
                              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className={styles.fileChip} title={f.name}>
                                <FileTypeIcon name={f.name} size={30} />
                                <span>{f.name}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.muted}>Файлы не приложены</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  function renderGallery() {
    return (
      <div className={styles.gallery}>
        {visible.map((item) => (
          <div key={item.id} className={styles.album}>
            <div className={styles.cover}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" />
              ) : (
                <span>Нет обложки</span>
              )}
            </div>
            <div className={styles.albumBody}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.meta}>
                {item.category && <span>{item.category}</span>}
                <span>{formatDate(item.createdAt)}</span>
              </div>
              {item.fileUrl && (
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.driveLink}>
                  Открыть в Google Диске →
                </a>
              )}
            </div>
            {actions(item)}
          </div>
        ))}
      </div>
    );
  }

  // ---------- Редактор ----------
  const editorTitle = editor?.id ? "Редактирование" : currentTab.add;

  return (
    <PageShell title="Управление базой знаний" wide>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
              onClick={() => { setTab(t.key); setQuery(""); setEditor(null); setPageError(""); }}
            >
              {t.label}
              <span className={styles.tabCount}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => openEditor()}>+ {currentTab.add.replace("Добавить ", "")}</Button>
      </div>

      {editor && (
        <form onSubmit={handleSubmit} className={styles.editor}>
          <div className={styles.editorHead}>
            <h2 className={styles.editorTitle}>{editorTitle}</h2>
            <button type="button" className={styles.close} onClick={closeEditor} aria-label="Закрыть">×</button>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Заголовок</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tab === "docs" ? "Название документа" : "Заголовок"} />
          </label>

          {tab === "news" && (
            <div className={styles.field}>
              <span className={styles.label}>Тип</span>
              <Select value={newsType} onChange={setNewsType} options={NEWS_TYPE_OPTIONS} ariaLabel="Тип материала" />
            </div>
          )}

          {tab === "news" && (
            <div className={styles.field}>
              <button type="button" className={`${styles.toggle} ${isImportant ? styles.toggleOn : ""}`} aria-pressed={isImportant} onClick={() => setIsImportant(!isImportant)}>
                <span className={styles.check}>{isImportant ? "✓" : ""}</span> Важное — показывать выше остальных
              </button>
            </div>
          )}

          <label className={styles.field}>
            <span className={styles.label}>{tab === "gallery" ? "Короткое описание альбома" : tab === "docs" ? "Описание (необязательно)" : "Текст"}</span>
            <textarea className="textarea" value={content} onChange={(e) => setContent(e.target.value)} rows={tab === "news" ? 6 : 3} />
          </label>

          <div className={styles.field}>
            <span className={styles.label}>{tab === "docs" ? "Папка" : "Категория"}</span>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={tab === "docs" ? "Выберите папку ниже или введите название новой" : "Необязательно"}
            />
            {folderNames.length > 0 && (
              <div className={styles.suggest}>
                {folderNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`${styles.suggestChip} ${category === name ? styles.suggestActive : ""}`}
                    onClick={() => setCategory(category === name ? "" : name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tab === "docs" && (
            <div className={styles.field}>
              <span className={styles.label}>Файлы документа</span>
              {existingFiles.length > 0 && (
                <div className={styles.fileList}>
                  {existingFiles.map((f, i) => (
                    <div key={`${f.url}-${i}`} className={styles.fileRow}>
                      <FileTypeIcon name={f.name} size={36} />
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className={styles.fileRowName} title={f.name}>{f.name}</a>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => setExistingFiles(existingFiles.filter((_, idx) => idx !== i))}
                        aria-label={`Убрать файл ${f.name}`}
                      >
                        Убрать
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {existingFiles.length === 0 && <p className={styles.muted}>Пока нет загруженных файлов</p>}
              <AttachButton files={newFiles} onChange={setNewFiles} label="Добавить файлы" />
              <p className={styles.hint}>Лишние файлы уберите, новые добавьте и нажмите «Сохранить» — список обновится целиком.</p>
            </div>
          )}

          {tab === "gallery" && (
            <label className={styles.field}>
              <span className={styles.label}>Ссылка на папку в Google Drive</span>
              <input className="input" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="https://drive.google.com/..." />
            </label>
          )}

          {tab === "news" && (
            <div className={styles.field}>
              <span className={styles.label}>Вложение (необязательно)</span>
              {attachment && newAttachment.length === 0 && (
                <div className={styles.fileRow}>
                  <FileTypeIcon name={attachment.name} size={36} />
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={styles.fileRowName}>{attachment.name}</a>
                  <button type="button" className={styles.removeBtn} onClick={() => setAttachment(null)}>Убрать</button>
                </div>
              )}
              <AttachButton files={newAttachment} onChange={setNewAttachment} multiple={false} label={attachment ? "Заменить файл" : "Прикрепить файл"} />
            </div>
          )}

          {tab !== "docs" && (
            <div className={styles.field}>
              <span className={styles.label}>{tab === "gallery" ? "Обложка альбома" : "Картинка-баннер (необязательно)"}</span>
              {existingImage && newImage.length === 0 && (
                <div className={styles.imagePreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={existingImage} alt="" />
                  <button type="button" className={styles.removeBtn} onClick={() => setExistingImage(null)}>Убрать</button>
                </div>
              )}
              <AttachButton files={newImage} onChange={setNewImage} multiple={false} accept="image/*" label={existingImage ? "Заменить картинку" : "Выбрать картинку"} />
            </div>
          )}

          <FormError message={error} />
          <div className={styles.editorActions}>
            <Button type="submit" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить"}</Button>
            <Button type="button" variant="secondary" onClick={closeEditor}>Отмена</Button>
          </div>
        </form>
      )}

      <div className={styles.searchRow}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === "docs" ? "Поиск по документам, папкам и файлам" : "Поиск по заголовку"}
          aria-label="Поиск"
        />
      </div>

      <FormError message={pageError} />

      {tab === "news" && renderNews()}
      {tab === "docs" && renderDocs()}
      {tab === "gallery" && renderGallery()}

      {visible.length === 0 && (
        <p className="text-s">{tabItems.length === 0 ? "Здесь пока ничего нет — добавьте первую запись" : "Ничего не найдено"}</p>
      )}
    </PageShell>
  );
}
