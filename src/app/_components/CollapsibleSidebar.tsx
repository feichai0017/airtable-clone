"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Home,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { CreateBaseButton } from "./CreateBaseButton";

export function CollapsibleSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navigationItems = [
        {
            name: "Home",
            href: "/",
            icon: Home,
            current: true,
        },
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: Users,
            current: false,
        },
        {
            name: "Settings",
            href: "/settings",
            icon: Settings,
            current: false,
        },
    ];

    return (
        <aside className={`
      ${isCollapsed ? 'w-16' : 'w-64'} 
      bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-screen
    `}>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
                {!isCollapsed && (
                    <h2 className="text-lg font-semibold text-gray-900">Workspace</h2>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100"
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <ChevronLeft className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
                <ul className="space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`
                    flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${item.current
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }
                    ${isCollapsed ? 'w-10 h-10 mx-auto' : ''}
                  `}
                                >
                                    <Icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
                                    {!isCollapsed && <span>{item.name}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Create Base Button at Bottom */}
            <div className="px-4 py-6 border-t border-gray-200">
                <CreateBaseButton
                    variant="sidebar"
                    isCollapsed={isCollapsed}
                />
            </div>
        </aside>
    );
} 