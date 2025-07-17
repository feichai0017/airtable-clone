import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const columnsRouter = createTRPCRouter({
  // Get all columns for a table
  getByTableId: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      return ctx.db.column.findMany({
        where: { tableId: input.tableId },
        orderBy: { order: "asc" },
      });
    }),

  // Create a new column
  create: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      name: z.string().min(1).max(100),
      type: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      // Get current column count for order
      const columnCount = await ctx.db.column.count({
        where: { tableId: input.tableId }
      });

      // Just create the column, don't update existing rows to avoid timeout
      // The frontend will handle showing empty values for new columns
      return ctx.db.column.create({
        data: {
          name: input.name,
          type: input.type,
          tableId: input.tableId,
          order: columnCount,
        },
      });
    }),

  // Update a column
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      type: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const column = await ctx.db.column.findFirst({
        where: { id: input.id },
        include: {
          table: {
            include: { base: true }
          }
        }
      });

      if (!column || column.table.base.userId !== ctx.userId) {
        throw new Error("Column not found");
      }

      return ctx.db.column.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.type && { type: input.type }),
        },
      });
    }),

  // Delete a column
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const column = await ctx.db.column.findFirst({
        where: { id: input.id },
        include: {
          table: {
            include: { base: true }
          }
        }
      });

      if (!column || column.table.base.userId !== ctx.userId) {
        throw new Error("Column not found");
      }

      // Delete column (cells will be cascade deleted)
      return ctx.db.column.delete({
        where: { id: input.id },
      });
    }),

  // Reorder columns
  reorder: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      columnIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      // Update positions in transaction
      return ctx.db.$transaction(async (tx) => {
        const updates = input.columnIds.map((columnId, index) =>
          tx.column.update({
            where: { id: columnId },
            data: { order: index },
          })
        );

        await Promise.all(updates);
        return { success: true };
      });
    }),
}); 