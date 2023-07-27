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
    .input(z.object({ name: z.string().optional(), image: z.string().optional(), id: z.string() }))
    .mutation(async ({ input: { name, image, id }, ctx }) => {
      const currentUserId = ctx.session?.user.id;
      const updateUser = await ctx.prisma.user.update({
        where: {
          id: currentUserId,
        },
        data: name != null ? { name: name } : { image: image },
      })
      return { user: updateUser }
    }),

  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input: { userId }, ctx }) => {
      const currentUserId = ctx.session?.user.id;
      const existingFollow = await ctx.prisma.user.findFirst({
        where: {
          id: userId
          , followers: { some: { id: currentUserId } }
        }
      });
      let addedFollow
      if (existingFollow == null) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { followers: { connect: { id: currentUserId } } },
        });
        addedFollow = true;
      } else {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { followers: { disconnect: { id: currentUserId } } },
        });
        addedFollow = false;
      }
      return { addedFollow: addedFollow }
    }),

  followStatus: protectedProcedure
    .input(z.object({ id: z.string() })).query(async ({
      input: { id }, ctx }) => {
      const currentUserId = ctx.session?.user.id;
      const existingFollow = await ctx.prisma.user.findFirst({
        where: {
          id: id
          , followers: { some: { id: currentUserId } }
        }
      });
      let followObj = { text: "Follow", classes: "" };
      if (existingFollow) {
        followObj = { text: "Unfollow", classes: "bg-red-300" };
      }
      return {
        followObj
      }
    }),
})