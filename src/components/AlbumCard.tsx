import styles from "./AlbumCard.module.css";

export function AlbumCard({
  title,
  description,
  imageUrl,
  driveUrl,
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
  driveUrl: string;
}) {
  return (
    <a href={driveUrl} target="_blank" rel="noopener noreferrer" className={styles.card}>
      {imageUrl && <img src={imageUrl} alt="" className={styles.thumb} />}
      <span className="text-h4">{title}</span>
      <p className={`${styles.desc} text-s`}>{description}</p>
      <span className={`${styles.linkHint} text-xs`}>Открыть на Google Диске →</span>
    </a>
  );
}