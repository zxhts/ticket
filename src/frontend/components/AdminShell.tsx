import Link from "next/link";

type Props = {
  active: "statistics" | "records";
  title: string;
  description: string;
  children: React.ReactNode;
};

const navItems = [
  { key: "statistics", href: "/statistics", label: "统计看板", desc: "年度、金额、线路" },
  { key: "records", href: "/records", label: "行程管理", desc: "新增、导入、车票" },
] as const;

export default function AdminShell({ active, title, description, children }: Props) {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">铁</div>
          <div>
            <p className="eyebrow">个人出行档案</p>
            <h1>火车票管理</h1>
          </div>
        </div>

        <nav className="side-nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link
              className={`side-nav-item${active === item.key ? " active" : ""}`}
              href={item.href}
              key={item.key}
            >
              <strong>{item.label}</strong>
              <span>{item.desc}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="page-head">
          <div>
            <p className="eyebrow">管理系统</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
