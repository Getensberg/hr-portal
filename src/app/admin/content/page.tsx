"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetContentQuery,
  useCreateContentMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
  useUploadFileMutation,
} from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import styles from "./content-admin.module.css";

const TYPE_OPTIONS = ["KNOWLEDGE_ARTICLE", "NEWS_POST", "POLICY_DOCUMENT", "GALLERY_ALBUM"];
const TYPE_LABELS: Record<string, string> = {
  KNOWLEDGE_ARTICLE: "Статья",
  NEWS_POST: "Новость",
  POLICY_DOCUMENT: "Регламент",
  GALLERY_ALBUM: "Фотоальбом",
};

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

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [category, setCategory] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAlbum = type === "GALLERY_ALBUM";
  const isDocument = type === "POLICY_DOCUMENT";

  if (status === "loading" || !session || session.user.role !== "HR_ADMIN") {
    return <p className="text-s">Загрузка...</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let uploadedFiles: { url: string; name: string }[] | undefined;

    if (isAlbum) {
      fileUrl = driveLink;
      fileName = "Google Drive";
    } else if (isDocument && files && files.length > 0) {
      uploadedFiles = [];
      for (const f of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", f);
        const uploaded = await uploadFile(formData).unwrap();
        uploadedFiles.push({ url: uploaded.url, name: uploaded.name });
      }
    } else if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await uploadFile(formData).unwrap();
      fileUrl = uploaded.url;
      fileName = uploaded.name;
    }

    let imageUrl: string | undefined;
    if (image) {
      const formData = new FormData();
      formData.append("file", image);
      const uploaded = await uploadFile(formData).unwrap();
      imageUrl = uploaded.url;
    }

    if (editingId) {
      await updateContent({
        id: editingId,
        title,
        content,
        type: type as any,
        category,
        fileUrl,
        fileName,
        files: uploadedFiles,
        imageUrl,
      });
      setEditingId(null);
    } else {
      await createContent({
        title,
        content,
        type: type as any,
        category,
        fileUrl,
        fileName,
        files: uploadedFiles,
        imageUrl,
      });
    }
    setTitle(""); setContent(""); setCategory(""); setFile(null); setFiles(null); setImage(null); setDriveLink("");
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setType(item.type);
    setCategory(item.category ?? "");
    setFile(null);
    setFiles(null);
    setImage(null);
    setDriveLink(item.type === "GALLERY_ALBUM" ? (item.fileUrl ?? "") : "");
  }

  return (
    <PageShell title="Управление базой знаний" wide>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок" />
        <textarea
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isAlbum ? "Короткое описание альбома" : "Текст"}
          rows={4}
        />
        <div className={styles.formRow}>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" />
        </div>

        {isAlbum ? (
          <input
            className="input"
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="Ссылка на папку в Google Drive"
          />
        ) : isDocument ? (
          <div>
            <label className="text-xs">Файлы (можно выбрать несколько)</label>
            <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
          </div>
        ) : (
          <div>
            <label className="text-xs">Файл-приложение (документ)</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        )}

        <div>
          <label className="text-xs">{isAlbum ? "Обложка альбома" : "Картинка-баннер (необязательно, для новостей)"}</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </div>

        <div>
          <Button type="submit">{editingId ? "Сохранить" : "Добавить"}</Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setDriveLink(""); }} style={{ marginLeft: 8 }}>
              Отмена
            </Button>
          )}
        </div>
      </form>

      {items?.map((item) => (
        <Card key={item.id}>
          <div className={styles.itemRow}>
            <span className="text-s">
              <strong>{item.title}</strong> · {TYPE_LABELS[item.type]}
              {item.fileUrl && item.type !== "GALLERY_ALBUM" && <> · 📎 {item.fileName}</>}
              {item.files && item.files.length > 0 && <> · 📎 {item.files.length} файл(ов)</>}
              {item.imageUrl && <> · 🖼</>}
            </span>
            <div className={styles.itemActions}>
              <Button variant="secondary" onClick={() => startEdit(item)}>Изменить</Button>
              <Button variant="danger" onClick={() => deleteContent(item.id)}>Удалить</Button>
            </div>
          </div>
        </Card>
      ))}
    </PageShell>
  );
}