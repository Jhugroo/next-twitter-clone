import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({
    input: { id }, ctx }) => {
    const currentUserId = ctx.session?.user.id;
    const profile = ctx.prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        image: true,
        _count: { select: { followers: true, follows: true, tweets: true } },
        followers: currentUserId == null
          ? undefined
          : { where: { id: currentUserId } },
      },
    });
    if (profile == null) return
    return;
  })
})