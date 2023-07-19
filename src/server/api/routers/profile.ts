import { Prisma } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({
    input: { id }, ctx }) => {
    const currentUserId = ctx.session?.user.id;
    const profile = await ctx.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        _count: { select: { followers: true, follows: true, tweets: true, likes: true } },
        followers: currentUserId == null
          ? undefined
          : { where: { id: currentUserId } },
      },
    });
    if (profile == null) return
    return {
      id: profile.id,
      name: profile.name,
      image: profile.image,
      followersCount: profile._count.followers,
      followsCount: profile._count.follows,
      tweetsCount: profile._count.tweets,
      likesCount: profile._count.likes
    }
  }),
  updateUser: protectedProcedure
    .input(z.object({ name: z.string(), id: z.string() }))
    .mutation(async ({ input: { name, id }, ctx }) => {
      const updateUser = await ctx.prisma.user.update({
        where: {
          id: id,
        },
        data: {
          name: name,
        },
      })
      return { addedLike: updateUser }
    }),
})