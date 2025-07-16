import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const basesRouter = createTRPCRouter({
  // Get all bases for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.base.findMany({
      where: { userId: ctx.userId },
      include: {
        tables: {
          include: {
            _count: {
              select: { rows: true, columns: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get a single base by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.base.findFirst({
        where: { 
          id: input.id,
          userId: ctx.userId 
        },
        include: {
          tables: {
            include: {
              _count: {
                select: { rows: true, columns: true }
              }
            }
          }
        }
      });

      if (!base) {
        throw new Error("Base not found");
      }

      return base;
    }),

  // Create a new base
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.base.create({
        data: {
          name: input.name,
          userId: ctx.userId,
        },
      });
    }),

  // Update a base
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const base = await ctx.db.base.findFirst({
        where: { 
          id: input.id,
          userId: ctx.userId 
        }
      });

      if (!base) {
        throw new Error("Base not found");
      }

      return ctx.db.base.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
        },
      });
    }),

  // Delete a base
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const base = await ctx.db.base.findFirst({
        where: { 
          id: input.id,
          userId: ctx.userId 
        }
      });

      if (!base) {
        throw new Error("Base not found");
      }

      return ctx.db.base.delete({
        where: { id: input.id },
      });
    }),
}); 