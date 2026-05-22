import type { Metadata } from "next";
import "antd/dist/reset.css";
import "@/src/frontend/styles/styles.css";
import AppProviders from "@/src/frontend/components/AppProviders";

export const metadata: Metadata = {
  title: "火车乘坐记录与车票生成器",
  description: "统计个人火车行程并生成车票",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
