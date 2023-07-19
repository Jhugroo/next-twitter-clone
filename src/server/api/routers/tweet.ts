import { Prisma } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const tweetRouter = createTRPCRouter({
  infiniteFeed: publicProcedure.input(
    z.object({
      limit: z.number().optional(),
      currentId: z.string().optional(),
      onlyFollowing: z.boolean().optional(),
      cursor: z.object({
        id: z.string(),
        createdAt: z.date()
      }).optional(),
    })
  ).query(async ({ input: { limit = 10, onlyFollowing = false, currentId = null, cursor }, ctx }) => {
    const currentUserId = ctx.session?.user.id;
    return await getInfiniteTweets({
      limit,
      ctx,
      cursor,
      whereClause:
        currentUserId == null || !onlyFollowing
          ? currentId ? {
            user: {
              id: currentId
            },
          } : undefined
          : {
            user: {
              followers: { some: { id: currentUserId } },
            },
          },
    });
  }),

  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input: { content }, ctx }) => {
      const tweet = await ctx.prisma.tweet.create({
        data: { content, userId: ctx.session.user.id }
      });

      return tweet;
    }),

  toggleLike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const data = { tweetId: id, userId: ctx.session.user.id };
      const existingLike = await ctx.prisma.like.findUnique({
        where: { userId_tweetId: data }
      })
      if (existingLike == null) {
        await ctx.prisma.like.create({ data })
        return { addedLike: true }
      } else {
        await ctx.prisma.like.delete({ where: { userId_tweetId: data } })
        return { addedLike: false }
      }
    }),
  updateTweet: protectedProcedure
    .input(z.object({ content: z.string(), id: z.string() }))
    .mutation(async ({ input: { content, id }, ctx }) => {
      const updateTweet = await ctx.prisma.tweet.update({
        where: {
          id: id,
        },
        data: {
          content: content,
        },
      })
      return { tweet: updateTweet }
    }),
  // router to get likes by where tweet id 
  // and from likes get user name
  getLikeUsersFromTweet: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id }, ctx }) => {
      return { users: null }
    }),
});

async function getInfiniteTweets({
  whereClause, ctx, limit, cursor
}: { whereClause?: Prisma.TweetWhereInput, limit: number, cursor: { id: string, createdAt: Date } | undefined, ctx: inferAsyncReturnType<typeof createTRPCContext> }) {
  const currentUserId = ctx.session?.user.id;
  const tweets = await ctx.prisma.tweet.findMany({
    take: limit + 1,
    cursor: cursor ? { createdAt_id: cursor } : undefined,
    where: whereClause,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      content: true,
      createdAt: true,
      _count: { select: { likes: true } },
      likes: currentUserId == null ? false : { where: { userId: currentUserId } },
      user: {
        select: { name: true, id: true, image: true }
      },
    },
  });
  let nextCursor: typeof cursor | undefined;

  if (tweets.length > limit) {
    const nextItem = tweets.pop();
    nextItem ? nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt } : null;
  }
  return {
    tweets: tweets.map(tweet => {
      return {
        id: tweet.id,
        content: tweet.content,
        createdAt: tweet.createdAt,
        likeCount: tweet._count.likes,
        user: tweet.user,
        likedByMe: tweet.likes?.length > 0,
      };
    }),
    nextCursor
  };
}