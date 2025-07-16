"use client";

import Link from "next/link";
import { Loader2, MoreVertical } from "lucide-react";
import { api } from "~/trpc/react";
import { useState, useRef, useEffect } from "react";

export function BaseList() {
    const utils = api.useUtils();
    const [bases] = api.bases.getAll.useSuspenseQuery();
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const deleteMutation = api.bases.delete.useMutation({
        onSuccess: () => {
            void utils.bases.getAll.invalidate();
            showToast("Base deleted", "Your base has been successfully deleted.");
        },
    });

    const handleDelete = (id: string) => {
        deleteMutation.mutate({ id });
        setOpenMenuId(null);
    };


    const [toast, setToast] = useState<{ visible: boolean; title: string; message: string }>({
        visible: false,
        title: "",
        message: "",
    });

    const showToast = (title: string, message: string) => {
        setToast({ visible: true, title, message });
        setTimeout(() => {
            setToast({ visible: false, title: "", message: "" });
        }, 3000);
    };


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);



    if (!bases || bases.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 sm:p-8 md:p-12">
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <p className="font-medium text-gray-700">No bases</p>
                    <p className="text-sm text-gray-500">
                        You can get started by creating a new base!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>

            {toast.visible && (
                <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white p-4 shadow-lg border border-gray-200">
                    <h4 className="font-medium">{toast.title}</h4>
                    <p className="text-sm text-gray-500">{toast.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto">
                {bases.map((base) => (
                    <Link
                        href={`/base/${base.id}`}
                        key={base.id}
                        className="group relative flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-gray-400 hover:shadow-md"
                        onMouseEnter={() => setHoveredId(base.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {hoveredId === base.id && (
                            <div className="absolute right-3 top-3 z-10" ref={menuRef}>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setOpenMenuId(openMenuId === base.id ? null : base.id);
                                    }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                >
                                    <MoreVertical size={16} />
                                </button>

                                {openMenuId === base.id && (
                                    <div className="absolute right-0 mt-1 w-36 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                                        <button
                                            className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete(base.id);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-blue-600 text-white">
                                {base.name.substring(0, 2).toUpperCase() || "UN"}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium truncate">{base.name || "Untitled Base"}</h3>
                                <p className="text-sm text-gray-500">
                                    {base.tables?.length || 0} {base.tables?.length === 1 ? "table" : "tables"}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );
}

export default BaseList; 