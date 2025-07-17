import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const FilterSchema = z.object({
  columnName: z.string(),
  operator: z.enum(["equals", "notEquals", "contains", "notContains", "isEmpty", "isNotEmpty", "greaterThan", "lessThan"]),
  value: z.string().optional(),
});

const SortSchema = z.object({
  columnName: z.string(),
  direction: z.enum(["asc", "desc"]),
});

export const rowsRouter = createTRPCRouter({
  // Paginated rows with filtering and search
  getPaginated: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      limit: z.number().min(1).max(1000).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
      filters: z.array(FilterSchema).optional().default([]),
      sorts: z.array(SortSchema).optional().default([]),
    }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: {
          base: true,
          columns: {
            orderBy: { order: "asc" }
          }
        }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      const whereClause: any = { tableId: input.tableId };

      // Cross-column text search
      if (input.search) {
        whereClause.OR = [
          {
            data: {
              string_contains: input.search,
            }
          },
          ...table.columns.map(column => ({
            data: {
              path: [column.name],
              string_contains: input.search,
            }
          }))
        ];
      }

      // JSONB field filtering
      if (input.filters.length > 0) {
        const filterConditions = input.filters.map(filter => {
          switch (filter.operator) {
            case "equals":
              return {
                data: {
                  path: [filter.columnName],
                  equals: filter.value
                }
              };
            case "notEquals":
              return {
                NOT: {
                  data: {
                    path: [filter.columnName],
                    equals: filter.value
                  }
                }
              };
            case "contains":
              return {
                data: {
                  path: [filter.columnName],
                  string_contains: filter.value
                }
              };
            case "notContains":
              return {
                NOT: {
                  data: {
                    path: [filter.columnName],
                    string_contains: filter.value
                  }
                }
              };
            case "isEmpty":
              return {
                OR: [
                  {
                    data: {
                      path: [filter.columnName],
                      equals: ""
                    }
                  },
                  {
                    NOT: {
                      data: {
                        path: [filter.columnName]
                      }
                    }
                  }
                ]
              };
            case "isNotEmpty":
              return {
                AND: [
                  {
                    data: {
                      path: [filter.columnName]
                    }
                  },
                  {
                    NOT: {
                      data: {
                        path: [filter.columnName],
                        equals: ""
                      }
                    }
                  }
                ]
              };
            case "greaterThan":
              return {
                data: {
                  path: [filter.columnName],
                  gt: filter.value
                }
              };
            case "lessThan":
              return {
                data: {
                  path: [filter.columnName],
                  lt: filter.value
                }
              };
            default:
              return null;
          }
        }).filter(Boolean);

        if (filterConditions.length > 0) {
          whereClause.AND = filterConditions;
        }
      }

      let orderBy: any[] = [{ order: "asc" }];

      if (input.sorts.length > 0) {
        // Default ordering maintained for JSONB compatibility
      }

      const total = await ctx.db.row.count({ where: whereClause });

      const rows = await ctx.db.row.findMany({
        where: whereClause,
        orderBy,
        skip: input.offset,
        take: input.limit,
      });

      return {
        rows: rows.map(row => ({
          id: row.id,
          order: row.order,
          data: row.data as Record<string, string>
        })),
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  getCount: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      return ctx.db.row.count({
        where: { tableId: input.tableId }
      });
    }),

  create: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      data: z.record(z.string(), z.string()).optional().default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: {
          base: true,
          columns: true
        }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      const maxOrderRow = await ctx.db.row.findFirst({
        where: { tableId: input.tableId },
        orderBy: { order: "desc" },
      });

      const newOrder = (maxOrderRow?.order ?? -1) + 1;

      const rowData: Record<string, string> = {};
      table.columns.forEach(column => {
        rowData[column.name] = input.data[column.name] || "";
      });

      return ctx.db.row.create({
        data: {
          tableId: input.tableId,
          order: newOrder,
          data: rowData,
        },
      });
    }),

  // Add bulk create endpoint to avoid order conflicts
  bulkCreate: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      records: z.array(z.record(z.string(), z.string())),
    }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: {
          base: true,
          columns: true
        }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      return ctx.db.$transaction(async (tx) => {
        // Get the current max order in a single query within transaction
        const maxOrderRow = await tx.row.findFirst({
          where: { tableId: input.tableId },
          orderBy: { order: "desc" },
        });

        const startOrder = (maxOrderRow?.order ?? -1) + 1;

        // Create all rows with sequential order values
        const rowsToCreate = input.records.map((recordData, index) => {
          const rowData: Record<string, string> = {};
          table.columns.forEach(column => {
            rowData[column.name] = recordData[column.name] || "";
          });

          return {
            tableId: input.tableId,
            order: startOrder + index,
            data: rowData,
          };
        });

        // Use createMany for better performance
        await tx.row.createMany({
          data: rowsToCreate,
        });

        return { created: rowsToCreate.length };
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.record(z.string(), z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.row.findFirst({
        where: { id: input.id },
        include: {
          table: {
            include: { base: true }
          }
        }
      });

      if (!row || row.table.base.userId !== ctx.userId) {
        throw new Error("Row not found");
      }

      const currentData = row.data as Record<string, string>;
      const updatedData = { ...currentData, ...input.data };

      return ctx.db.row.update({
        where: { id: input.id },
        data: { data: updatedData },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.row.findFirst({
        where: { id: input.id },
        include: {
          table: {
            include: { base: true }
          }
        }
      });

      if (!row || row.table.base.userId !== ctx.userId) {
        throw new Error("Row not found");
      }

      return ctx.db.row.delete({
        where: { id: input.id },
      });
    }),

  bulkDelete: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
      tableId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      return ctx.db.row.deleteMany({
        where: {
          id: { in: input.ids },
          tableId: input.tableId,
        },
      });
    }),

  bulkUpdate: protectedProcedure
    .input(z.object({
      updates: z.array(z.object({
        id: z.string(),
        data: z.record(z.string(), z.string()),
      })),
      tableId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.tableId },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      return ctx.db.$transaction(async (tx) => {
        const updates = input.updates.map(async (update) => {
          const row = await tx.row.findFirst({
            where: { id: update.id, tableId: input.tableId }
          });

          if (!row) return null;

          const currentData = row.data as Record<string, string>;
          const updatedData = { ...currentData, ...update.data };

          return tx.row.update({
            where: { id: update.id },
            data: { data: updatedData },
          });
        });

        return Promise.all(updates);
      });
    }),
}); 