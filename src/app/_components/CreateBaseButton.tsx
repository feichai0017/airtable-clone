"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";

interface CreateBaseButtonProps {
  variant?: "default" | "sidebar";
  isCollapsed?: boolean;
}

export function CreateBaseButton({ variant = "default", isCollapsed = false }: CreateBaseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const utils = api.useUtils();
  const createBase = api.bases.create.useMutation({
    onSuccess: async () => {
      await utils.bases.invalidate();
      setIsOpen(false);
      setName("");
      showToast("Base created", "Your new base has been created successfully!");
    },
    onError: (error) => {
      showToast("Error", error.message || "Failed to create base");
    },
  });


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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createBase.mutate({
        name: name.trim(),
      });
    }
  };


  const renderButton = () => {
    if (variant === "sidebar") {
      if (isCollapsed) {
        return (
          <button
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 p-3 text-white shadow-sm transition-colors hover:bg-blue-700"
            title="Create Base"
          >
            <Plus className="h-6 w-6" />
          </button>
        );
      } else {
        return (
          <button
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Base</span>
          </button>
        );
      }
    }


    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Plus className="h-4 w-4" />
        Create
      </button>
    );
  };

  return (
    <>

      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white p-4 shadow-lg border border-gray-200">
          <h4 className="font-medium">{toast.title}</h4>
          <p className="text-sm text-gray-500">{toast.message}</p>
        </div>
      )}

      {renderButton()}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">

            <div
              className="fixed inset-0 bg-black/30 transition-opacity"
              onClick={() => setIsOpen(false)}
            />


            <div className="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
              <div className="p-6">

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create a new base
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="base-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="base-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter base name..."
                      required
                      autoFocus
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Give your base a descriptive name
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createBase.isPending || !name.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createBase.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      {createBase.isPending ? "Creating..." : "Create base"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateBaseButton; 