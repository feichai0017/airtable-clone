
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";

import { db } from "~/server/db";

// tRPC context creation
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId: clerkUserId } = await auth();
  
  return {
    db,
    clerkUserId,
    ...opts,
  };
};

// tRPC initialization
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});


export const createCallerFactory = t.createCallerFactory;

// Router and procedure creation
export const createTRPCRouter = t.router;

// Development timing middleware
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

// Public procedure
export const publicProcedure = t.procedure.use(timingMiddleware);

// Protected procedure
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.clerkUserId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Find or create user in our database
    let user = await ctx.db.user.findUnique({
      where: { clerkId: ctx.clerkUserId }
    });

    if (!user) {
      // Create user if doesn't exist
      user = await ctx.db.user.create({
        data: {
          clerkId: ctx.clerkUserId,
        },
      });
    }

    return next({
      ctx: {
        ...ctx,
        userId: user.id,
        clerkUserId: ctx.clerkUserId,
      },
    });
  });
