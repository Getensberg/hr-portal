// Запускается один раз при старте сервера Next.js: подключаем фоновые задачи
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startJobs } = await import("./lib/jobs");
    startJobs();
  }
}
