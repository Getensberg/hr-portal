// Ссылка для сброса пароля из командной строки (если HR сам забыл пароль и войти в портал нельзя):
//   npm run reset-link -- name@company.ru
// Запускать там, где доступна база (локально с нужным .env или на сервере).
import { prisma } from "../src/lib/prisma";
import { createPasswordToken, passwordLink, TOKEN_TTL_DAYS } from "../src/lib/passwordTokens";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Укажите email: npm run reset-link -- name@company.ru");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  if (!user) {
    console.error("Пользователь не найден");
    process.exit(1);
  }
  const link = passwordLink(await createPasswordToken(user.id));
  console.log(`Ссылка (действует ${TOKEN_TTL_DAYS} дн.):\n${link.startsWith("/") ? "<адрес портала>" + link : link}`);
}

main().finally(() => prisma.$disconnect());
