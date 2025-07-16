"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { api } from "~/trpc/react";

export function SyncUserProvider() {
    const { userId } = useAuth();

    useEffect(() => {
        if (userId) {
            console.log("User authenticated:", userId);
        }
    }, [userId]);

    return null;
} 