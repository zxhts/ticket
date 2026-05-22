"use client";

import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

dayjs.locale("zh-cn");

export default function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ConfigProvider locale={zhCN}>{children}</ConfigProvider>;
}
