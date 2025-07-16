import { basesRouter } from "~/server/api/routers/bases";
import { tablesRouter } from "~/server/api/routers/tables";
import { columnsRouter } from "~/server/api/routers/columns";
import { rowsRouter } from "~/server/api/routers/rows";
import { viewsRouter } from "~/server/api/routers/views";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  bases: basesRouter,
  tables: tablesRouter,
  columns: columnsRouter,
  rows: rowsRouter,
  views: viewsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
