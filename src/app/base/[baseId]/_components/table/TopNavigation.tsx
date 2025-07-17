import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

interface TopNavigationProps {
  baseName: string;
  isLoading: boolean;
  onSaveAllPendingChanges: () => Promise<boolean>;
}

export function TopNavigation({ 
  baseName, 
  isLoading, 
  onSaveAllPendingChanges 
}: TopNavigationProps) {
  const { baseId } = useParams();

  const handleSave = async () => {
    await onSaveAllPendingChanges();
  };

  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="text-lg font-semibold text-gray-900">
          {isLoading ? "Loading..." : baseName}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleSave}
          className="flex items-center space-x-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          <span>Save All</span>
        </button>
        
        {/* User account info */}
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </div>
  );
} 