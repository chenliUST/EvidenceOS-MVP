import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "EvidenceOS MVP",
  description: "Decision-grade evidence memos for hiring and investor diligence"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
