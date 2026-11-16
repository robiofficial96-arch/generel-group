import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { num } from "@/lib/format";

export type TeamMember = {
  id: string;
  name: string;
  mobile: string;
  status: "NORMAL" | "ACTIVE";
  createdAt: Date;
  depth: number;
  /** Which leg of the root this member sits under. */
  leg: "LEFT" | "RIGHT";
  uplineId: string | null;
  leftChildId: string | null;
  rightChildId: string | null;
  invested: number;
};

/** Every member below `rootId` in the binary tree (optionally depth-limited). */
export async function getSubtree(rootId: string, maxDepth = 1000): Promise<TeamMember[]> {
  const rows = await prisma.$queryRaw<
    (Omit<TeamMember, "invested" | "depth"> & { invested: Prisma.Decimal; depth: number })[]
  >(Prisma.sql`
    WITH RECURSIVE sub AS (
      SELECT u.id, 1 AS depth,
             CASE WHEN r."leftChildId" = u.id THEN 'LEFT' ELSE 'RIGHT' END AS leg
      FROM "User" u
      JOIN "User" r ON r.id = ${rootId}
      WHERE u.id = r."leftChildId" OR u.id = r."rightChildId"
      UNION ALL
      SELECT c.id, s.depth + 1, s.leg
      FROM "User" c
      JOIN "User" p ON p."leftChildId" = c.id OR p."rightChildId" = c.id
      JOIN sub s ON s.id = p.id
      WHERE s.depth < ${maxDepth}
    )
    SELECT s.id, s.depth::int AS depth, s.leg, u.name, u.mobile, u.status::text AS status,
           u."createdAt", u."uplineId", u."leftChildId", u."rightChildId",
           COALESCE((SELECT SUM(i.amount) FROM "Investment" i WHERE i."userId" = u.id), 0) AS invested
    FROM sub s
    JOIN "User" u ON u.id = s.id
    ORDER BY s.depth, u."createdAt"
  `);

  return rows.map((r) => ({ ...r, invested: num(r.invested) }));
}

export type TreeNode = {
  id: string;
  name: string;
  mobile: string;
  status: "NORMAL" | "ACTIVE";
  invested: number;
  hasMore: boolean;
  left: TreeNode | null;
  right: TreeNode | null;
};

/** Root + `levels` generations below it, as a nested structure for the tree view. */
export async function getTree(rootId: string, levels = 3): Promise<TreeNode | null> {
  const root = await prisma.user.findUnique({
    where: { id: rootId },
    select: {
      id: true,
      name: true,
      mobile: true,
      status: true,
      leftChildId: true,
      rightChildId: true,
      investments: { select: { amount: true } },
    },
  });
  if (!root) return null;

  const members = await getSubtree(rootId, levels);
  const byId = new Map(members.map((m) => [m.id, m]));

  const build = (id: string | null, depth: number): TreeNode | null => {
    if (!id) return null;
    const m = byId.get(id);
    if (!m) return null;
    const atEdge = depth >= levels;
    return {
      id: m.id,
      name: m.name,
      mobile: m.mobile,
      status: m.status,
      invested: m.invested,
      hasMore: atEdge && Boolean(m.leftChildId || m.rightChildId),
      left: atEdge ? null : build(m.leftChildId, depth + 1),
      right: atEdge ? null : build(m.rightChildId, depth + 1),
    };
  };

  return {
    id: root.id,
    name: root.name,
    mobile: root.mobile,
    status: root.status,
    invested: root.investments.reduce((sum, i) => sum + num(i.amount), 0),
    hasMore: false,
    left: build(root.leftChildId, 1),
    right: build(root.rightChildId, 1),
  };
}

/** True when `candidateId` is `rootId` itself or anywhere below it. */
export async function isInSubtree(rootId: string, candidateId: string): Promise<boolean> {
  if (rootId === candidateId) return true;
  let currentId: string | null = candidateId;
  for (let hops = 0; currentId && hops < 500; hops++) {
    const parent: { id: string } | null = await prisma.user.findFirst({
      where: { OR: [{ leftChildId: currentId }, { rightChildId: currentId }] },
      select: { id: true },
    });
    if (!parent) return false;
    if (parent.id === rootId) return true;
    currentId = parent.id;
  }
  return false;
}
