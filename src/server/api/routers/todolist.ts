import { Prisma } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";
import { now } from "next-auth/client/_utils";
import { z } from "zod";
import {
    createTRPCContext,
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";

export const todolistRouter = createTRPCRouter({
    todoListing: protectedProcedure.input(
        z.object({
            cursor: z.object({
                id: z.string(),
                createdAt: z.date()
            }).optional(),
        }))
        .query(async ({ input: { cursor }, ctx }) => {
            const currentUserId = ctx.session?.user.id;
            const todos = await ctx.prisma.todoList.findMany({
                take: 11,
                cursor: cursor ? { createdAt_id: cursor } : undefined,
                where: { userId: currentUserId },
                orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            });
            let nextCursor: typeof cursor | undefined;
            if (todos.length > 11) {
                const nextItem = todos.pop();
                nextItem ? nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt } : null;
            }
            return {
                todos: todos.map(todo => {
                    return {
                        id: todo.id,
                        task: todo.task,
                        complete: todo.complete,
                        createdAt: todo.createdAt,
                        updatedAt: todo.updatedAt
                    };
                }),
                nextCursor
            };
        }),

    create: protectedProcedure
        .input(z.object({ task: z.string() }))
        .mutation(async ({ input: { task }, ctx }) => {
            const todo = await ctx.prisma.todoList.create({
                data: { task: task, userId: ctx.session.user.id, updatedAt: new Date() }
            })
            return todo;
        }),
    updateTask: protectedProcedure
        .input(z.object({ currentState: z.boolean(), id: z.string() }))
        .mutation(async ({ input: { currentState, id }, ctx }) => {
            const updateTask = await ctx.prisma.todoList.update({
                where: {
                    id: id,
                },
                data: {
                    complete: !currentState,
                },
            })
            return { task: updateTask }
        }),
})