import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { api, HydrateClient } from "~/trpc/server";
import { DataTable } from "./_components/data-table";

interface TablePageProps {
    params: Promise<{ baseId: string; tableId: string }>;
}

export default async function TablePage({ params }: TablePageProps) {
    const { userId } = await auth();
    const { baseId, tableId } = await params;

    if (!userId) {
        redirect("/sign-in");
    }

    // Get table details
    const table = await api.tables.getById({ id: tableId });

    // Prefetch initial data
    void api.rows.getPaginated.prefetch({
        tableId,
        limit: 50,
        offset: 0
    });
    void api.columns.getByTableId.prefetch({ tableId });

    if (!table) {
        redirect(`/base/${baseId}`);
    }

    return (
        <HydrateClient>
            <div className="min-h-screen bg-white">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Link
                                    href={`/base/${baseId}`}
                                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back to {table.base.name}
                                </Link>
                                <div className="h-4 border-l border-gray-300" />
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {table.name}
                                </h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-500">
                                    {table._count.rows.toLocaleString()} rows
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Table Content */}
                <div className="flex-1">
                    <DataTable tableId={tableId} />
                </div>
            </div>
        </HydrateClient>
    );
} 