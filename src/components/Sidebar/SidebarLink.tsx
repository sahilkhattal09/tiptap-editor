import React from "react";

interface SidebarLinkProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  icon,
  text,
  active = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        active
          ? "bg-white text-purple-800 font-semibold"
          : "hover:bg-purple-800 text-white"
      }`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};

export default SidebarLink;
