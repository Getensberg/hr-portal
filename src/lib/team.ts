import { prisma } from "./prisma";

// Все, кто подчинён этому человеку, включая подчинённых его подчинённых
export async function getTeamUserIds(managerId: string): Promise<string[]> {
  const ids: string[] = [];
  let frontier = [managerId];

  while (frontier.length > 0) {
    const children = await prisma.user.findMany({
      where: { managerId: { in: frontier } },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);
    ids.push(...childIds);
    frontier = childIds;
  }
  return ids;
}