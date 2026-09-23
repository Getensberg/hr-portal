"use client";
import { useGetContentQuery } from "@/store/api";
import { PageShell } from "@/components/PageShell";
import { AlbumCard } from "@/components/AlbumCard";

export default function GalleryPage() {
  const { data: albums, isLoading } = useGetContentQuery({ type: "GALLERY_ALBUM" });

  return (
    <PageShell title="Фотогалерея">
      {isLoading && <p className="text-s">Загрузка...</p>}
      {albums?.map((a) => (
        <AlbumCard key={a.id} title={a.title} description={a.content} imageUrl={a.imageUrl} driveUrl={a.fileUrl ?? "#"} />
      ))}
      {albums?.length === 0 && <p className="text-s">Пока нет альбомов</p>}
    </PageShell>
  );
}