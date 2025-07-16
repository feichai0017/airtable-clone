import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Define view configuration schemas
const FilterConfigSchema = z.object({
  columnName: z.string(),
  operator: z.enum(["equals", "notEquals", "contains", "notContains", "isEmpty", "isNotEmpty", "greaterThan", "lessThan"]),
  value: z.string().optional(),
});

const SortConfigSchema = z.object({
  columnName: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export const viewsRouter = createTRPCRouter({
  // Get all views for a table
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

      return ctx.db.view.findMany({
        where: { tableId: input.tableId },
        orderBy: { createdAt: "asc" },
      });
    }),

  // Get a single view by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const view = await ctx.db.view.findFirst({
        where: { id: input.id },
        include: { 
          table: { 
            include: { base: true } 
          } 
        }
      });

      if (!view || view.table.base.userId !== ctx.userId) {
        throw new Error("View not found");
      }

      return view;
    }),

  // Create a new view
  create: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      name: z.string().min(1).max(100),
      type: z.string().optional().default("grid"),
      filter: z.any().optional(),
      sort: z.any().optional(),
      hiddenColumns: z.array(z.string()).optional().default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      return ctx.db.view.create({
        data: {
          name: input.name,
          type: input.type,
          tableId: input.tableId,
          filter: input.filter,
          sort: input.sort,
          hiddenColumns: input.hiddenColumns,
        },
      });
    }),

  // Update a view
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      type: z.string().optional(),
      filter: z.any().optional(),
      sort: z.any().optional(),
      hiddenColumns: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const view = await ctx.db.view.findFirst({
        where: { id: input.id },
        include: { 
          table: { 
            include: { base: true } 
          } 
        }
      });

      if (!view || view.table.base.userId !== ctx.userId) {
        throw new Error("View not found");
      }

      return ctx.db.view.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.type && { type: input.type }),
          ...(input.filter !== undefined && { filter: input.filter }),
          ...(input.sort !== undefined && { sort: input.sort }),
          ...(input.hiddenColumns && { hiddenColumns: input.hiddenColumns }),
        },
      });
    }),

  // Delete a view
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const view = await ctx.db.view.findFirst({
        where: { id: input.id },
        include: { 
          table: { 
            include: { base: true } 
          } 
        }
      });

      if (!view || view.table.base.userId !== ctx.userId) {
        throw new Error("View not found");
      }

      return ctx.db.view.delete({
        where: { id: input.id },
      });
    }),

  // Duplicate a view
  duplicate: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      name: z.string().min(1).max(100)
    }))
    .mutation(async ({ ctx, input }) => {
      const view = await ctx.db.view.findFirst({
        where: { id: input.id },
        include: { 
          table: { 
            include: { base: true } 
          } 
        }
      });

      if (!view || view.table.base.userId !== ctx.userId) {
        throw new Error("View not found");
      }

      return ctx.db.view.create({
        data: {
          name: input.name,
          type: view.type,
          tableId: view.tableId,
          filter: view.filter ?? Prisma.JsonNull,
          sort: view.sort ?? Prisma.JsonNull,
          hiddenColumns: view.hiddenColumns as string[],
        },
      });
    }),

  // Get default view for a table (just return the first view)
  getDefault: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      const firstView = await ctx.db.view.findFirst({
        where: { tableId: input.tableId },
        orderBy: { createdAt: "asc" },
      });

      // If no view exists, create a default one
      if (!firstView) {
        return ctx.db.view.create({
          data: {
            name: "Default View",
            type: "grid",
            tableId: input.tableId,
            filter: Prisma.JsonNull,
            sort: Prisma.JsonNull,
            hiddenColumns: [],
          },
        });
      }

      return firstView;
    }),
}); 