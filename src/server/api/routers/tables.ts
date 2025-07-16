import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { faker } from "@faker-js/faker";

export const tablesRouter = createTRPCRouter({
  // Get all tables for a base
  getAll: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify base ownership
      const base = await ctx.db.base.findFirst({
        where: { 
          id: input.baseId,
          userId: ctx.userId 
        }
      });

      if (!base) {
        throw new Error("Base not found");
      }

      return ctx.db.table.findMany({
        where: { baseId: input.baseId },
        include: {
          _count: {
            select: { rows: true, columns: true }
          },
          columns: {
            orderBy: { order: "asc" }
          }
        },
      });
    }),

  // Get a single table with columns
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.id },
        include: {
          base: true,
          columns: {
            orderBy: { order: "asc" }
          },
          _count: {
            select: { rows: true }
          }
        }
      });

      if (!table) {
        throw new Error("Table not found");
      }

      // Verify base ownership
      if (table.base.userId !== ctx.userId) {
        throw new Error("Access denied");
      }

      return table;
    }),

  // Create a new table with default columns and rows
  create: protectedProcedure
    .input(z.object({
      baseId: z.string(),
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify base ownership
      const base = await ctx.db.base.findFirst({
        where: { 
          id: input.baseId,
          userId: ctx.userId 
        }
      });

      if (!base) {
        throw new Error("Base not found");
      }

      return ctx.db.$transaction(async (tx) => {
        // Create table
        const table = await tx.table.create({
          data: {
            name: input.name,
            baseId: input.baseId,
          },
        });

        // Create default columns
        const columns = await Promise.all([
          tx.column.create({
            data: {
              name: "Name",
              type: "text",
              tableId: table.id,
              order: 0,
            },
          }),
          tx.column.create({
            data: {
              name: "Status",
              type: "text",
              tableId: table.id,
              order: 1,
            },
          }),
          tx.column.create({
            data: {
              name: "Priority",
              type: "number",
              tableId: table.id,
              order: 2,
            },
          }),
        ]);

        // Create default rows with fake data
        const rowsData = Array.from({ length: 10 }, (_, i) => ({
          order: i,
          tableId: table.id,
          data: {
            "Name": faker.person.fullName(),
            "Status": faker.helpers.arrayElement(["Todo", "In Progress", "Done"]),
            "Priority": faker.helpers.arrayElement(["1", "2", "3", "4", "5"]),
          }
        }));

        await Promise.all(
          rowsData.map(rowData => tx.row.create({ data: rowData }))
        );

        return table;
      });
    }),

  // Update table
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.id },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      return ctx.db.table.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
        },
      });
    }),

  // Delete table
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const table = await ctx.db.table.findFirst({
        where: { id: input.id },
        include: { base: true }
      });

      if (!table || table.base.userId !== ctx.userId) {
        throw new Error("Table not found");
      }

      return ctx.db.table.delete({
        where: { id: input.id },
      });
    }),

  // Generate large amount of fake data (100k rows)
  generateFakeData: protectedProcedure
    .input(z.object({ 
      tableId: z.string(),
      count: z.number().min(1).max(100000).default(100000)
    }))
    .mutation(async ({ ctx, input }) => {
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

      // Get current max order for position
      const maxOrderRow = await ctx.db.row.findFirst({
        where: { tableId: input.tableId },
        orderBy: { order: "desc" },
      });

      const startOrder = (maxOrderRow?.order ?? -1) + 1;

      const batchSize = 1000;
      const batches = Math.ceil(input.count / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min((i + 1) * batchSize, input.count);
        const batchCount = batchEnd - batchStart;

        await ctx.db.$transaction(async (tx) => {
          // Create rows in batch
          const rowsData = Array.from({ length: batchCount }, (_, j) => {
            const rowData: Record<string, string> = {};
            
            // Generate data for each column
            table.columns?.forEach(column => {
              let value = "";
              
              switch (column.type) {
                case "text":
                  if (column.name.toLowerCase().includes("name")) {
                    value = faker.person.fullName();
                  } else if (column.name.toLowerCase().includes("email")) {
                    value = faker.internet.email();
                  } else if (column.name.toLowerCase().includes("status")) {
                    value = faker.helpers.arrayElement(["Active", "Inactive", "Pending"]);
                  } else {
                    value = faker.lorem.words(2);
                  }
                  break;
                case "number":
                  value = faker.number.int({ min: 1, max: 1000 }).toString();
                  break;
                default:
                  value = faker.lorem.word();
              }

              rowData[column.name] = value;
            });

            return {
              order: startOrder + batchStart + j,
              tableId: input.tableId,
              data: rowData,
            };
          });

          await Promise.all(
            rowsData.map(rowData => tx.row.create({ data: rowData }))
          );
        });
      }

      return { generated: input.count, tableId: input.tableId };
    }),
}); 