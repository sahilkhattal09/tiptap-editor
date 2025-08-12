import React from "react";

interface PageProps {
  title: string;
  footerText?: string;
  children: React.ReactNode;
  className?: string;
}

export const Page: React.FC<PageProps> = ({
  title,
  footerText = "Page",
  children,
  className,
}) => {
  return (
    <div className={`page measure-page ${className ?? ""}`}>
      <div className="page-header">{title}</div>
      <div className="page-content">{children}</div>
      <div className="page-footer">{footerText}</div>
    </div>
  );
};
