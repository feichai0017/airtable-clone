import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";
import { SyncUserProvider } from "./_components/SyncUserProvider";


export const metadata: Metadata = {
  title: "Airtable Clone",
  description: "An Airtable clone with real-time editing, virtualized tables, and advanced filtering",
  applicationName: "Airtable Clone",
  authors: [{ name: "Airtable Clone Team" }],
  generator: "Next.js",
  keywords: ["airtable", "clone", "database", "tables", "spreadsheet", "react", "nextjs", "jsonb", "postgresql"],
  creator: "Airtable Clone Team",
  publisher: "Airtable Clone Team",
  robots: "index, follow",
  openGraph: {
    type: "website",
    title: "Airtable Clone - High-Performance Data Management",
    description: "A full-featured Airtable clone with JSONB storage, real-time editing and advanced data management",
    siteName: "Airtable Clone",
  },
  twitter: {
    card: "summary_large_image",
    title: "Airtable Clone - High-Performance Data Management",
    description: "A full-featured Airtable clone with JSONB storage, real-time editing and advanced data management",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <html lang="en" className={`${geist.variable} font-sans`}>
        <body className="antialiased">
          <TRPCReactProvider>
            <SyncUserProvider />
            {children}
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
