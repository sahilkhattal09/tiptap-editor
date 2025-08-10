"use client";

import { Bell, Search } from "lucide-react";
import Image from "next/image";

const Header = () => {
  return (
    <header className="w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left: Page title or breadcrumbs */}
      <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>

      {/* Right: Search + Notifications + Avatar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Notifications */}
        <div className="relative cursor-pointer text-gray-500 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <Image
            src="https://i.pravatar.cc/40?img=7"
            alt="User Avatar"
            width={40}
            height={40}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
