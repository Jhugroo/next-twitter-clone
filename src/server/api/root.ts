import { tweetRouter } from "~/server/api/routers/tweet";
import { profileRouter } from "~/server/api/routers/profile";
import { todolistRouter } from "~/server/api/routers/todolist";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  tweet: tweetRouter,
  profile: profileRouter,
  todolist: todolistRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
