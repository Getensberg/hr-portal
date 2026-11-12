import { redirect } from "next/navigation";

// Календарь теперь часть раздела «Заявки и календарь»; старые ссылки ведут туда
export default function CalendarPage() {
  redirect("/requests?view=calendar");
}
