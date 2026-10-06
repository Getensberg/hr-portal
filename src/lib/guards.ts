import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getHRSession() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "HR_ADMIN") return null;
  return session;
}