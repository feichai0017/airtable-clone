import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { api, HydrateClient } from "~/trpc/server";
import { CreateTableForm } from "./_components/create-table-form";
import { TablesGrid } from "./_components/tables-grid";

interface BasePageProps {
  params: Promise<{ baseId: string }>;
}

export default async function BasePage({ params }: BasePageProps) {
  const { userId } = await auth();
  const { baseId } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  // Get base details and prefetch tables
  const base = await api.bases.getById({ id: baseId });
  void api.tables.getAll.prefetch({ baseId });

  if (!base) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Workspaces
                </Link>
                <div className="h-4 border-l border-gray-300" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {base.name}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <CreateTableForm baseId={baseId} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tables</h2>
              </div>
            </div>
          </div>

          <TablesGrid baseId={baseId} />
        </main>
      </div>
    </HydrateClient>
  );
} 