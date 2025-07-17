import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CreateBaseButton } from "../_components/CreateBaseButton";
import BaseList from "../_components/BaseList";
import { CollapsibleSidebar } from "../_components/CollapsibleSidebar";
import { api, HydrateClient } from "~/trpc/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  // Redirect if user is NOT authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // Prefetch bases for better performance
  void api.bases.getAll.prefetch();

  return (
    <HydrateClient>
      <div className="flex h-screen">
        {/* Collapsible Sidebar */}
        <CollapsibleSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col">
          {/* Top Navigation Bar */}
          <header className="flex h-16 items-center justify-between border-b border-gray-200 px-4 md:px-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/Airtable Logo.png"
                  alt="Airtable Clone"
                  width={120}
                  height={28}
                  className="h-7 w-auto"
                />
              </Link>
            </div>

            <div className="relative mx-4 hidden max-w-xl flex-grow sm:flex md:mx-8">
              <div className="flex w-full items-center rounded-full border border-gray-300 bg-white px-3 py-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-gray-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-grow bg-transparent text-sm focus:outline-none"
                />
                <span className="hidden text-xs text-gray-400 md:inline">
                  ctrl K
                </span>
              </div>
            </div>

            {/* Mobile search button */}
            <button className="rounded-full p-2 text-gray-600 hover:bg-gray-100 sm:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <div className="flex items-center gap-2 md:gap-4">
              <button className="hidden rounded-full p-2 text-gray-600 hover:bg-gray-100 sm:block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              </button>
              <button className="hidden rounded-full p-2 text-gray-600 hover:bg-gray-100 sm:block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <div suppressHydrationWarning>
                <UserButton />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-0">
              <h1 className="text-lg font-semibold sm:text-xl">Dashboard</h1>
              <CreateBaseButton />
            </div>

            {/* Display bases with Suspense boundary */}
            <Suspense fallback={
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              </div>
            }>
              <BaseList />
            </Suspense>
          </main>
        </div>
      </div>
    </HydrateClient>
  );
} 