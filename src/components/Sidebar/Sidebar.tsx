"use client";

import { usePathname } from "next/navigation";
import {
  BookOpen,
  Globe,
  MessageSquare,
  PenTool,
  Bookmark,
  Edit,
  Clock,
  MoreVertical,
  User,
  Settings,
} from "lucide-react";
import Image from "next/image";
import SidebarLink from "./SidebarLink";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#2D1A47] text-white flex flex-col justify-between p-4 overflow-hidden z-50">
      {/* Top Section */}
      <div className="space-y-6 overflow-hidden">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="text-2xl">🧠</span>
          <span>Vettam.AI</span>
        </div>

        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold">
          New Chat
        </button>

        {/* Features */}
        <div className="bg-purple-700 rounded-lg p-4">
          <p className="text-xs uppercase text-gray-300 mb-3">Features</p>
          <nav className="flex flex-col gap-3 text-sm">
            <SidebarLink icon={<BookOpen size={16} />} text="Workspace" />
            <SidebarLink icon={<Globe size={16} />} text="Research" />
            <SidebarLink icon={<MessageSquare size={16} />} text="Translate" />
            <SidebarLink icon={<PenTool size={16} />} text="Write" />
          </nav>
        </div>

        {/* Tools */}
        <div className="bg-purple-600 rounded-lg p-4">
          <p className="text-xs uppercase text-gray-300 mb-3">Tools</p>
          <nav className="flex flex-col gap-3 text-sm">
            <SidebarLink icon={<Edit size={16} />} text="Editor" active />
            <SidebarLink icon={<Bookmark size={16} />} text="Bookmarks" />
          </nav>
        </div>

        {/* Chat History */}
        <div className="text-sm">
          <p className="uppercase text-xs text-gray-300 flex items-center gap-2 mb-2">
            <Clock size={14} /> Chat History
          </p>

          <div className="space-y-3">
            {[
              "Lorem ipsum dolor sit amet consectetur.",
              "Lorem ipsum dolor sit amet consectetur.",
              "Lorem ipsum dolor sit amet consectetur.",
            ].map((text, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start text-gray-200 hover:text-white cursor-pointer"
              >
                <p className="text-xs line-clamp-2 pr-2">{text}</p>
                <MoreVertical size={14} />
              </div>
            ))}
            <button className="text-xs text-gray-300 hover:underline mt-1">
              View more
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <Image
              src="https://i.pravatar.cc/40?img=5"
              alt="User"
              className="rounded-full object-cover"
              fill
            />
          </div>
          <p className="text-sm">Michael Smith</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Settings size={16} />
          <div className="relative">
            <User size={16} />
            <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
              12
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
