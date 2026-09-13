import { Bookmark, CheckCircle2, Circle, Clock3, Flag, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Difficulty, SourceType } from "@jeca/shared/types";

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet" | "danger" }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }

export function StatCard({ label, value, detail, icon: Icon, tone = "cyan" }: { label: string; value: string | number; detail?: string; icon: LucideIcon; tone?: "cyan" | "amber" | "green" | "violet" }) {
  return <Card className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={20} /></span><div><p>{label}</p><strong>{value}</strong>{detail && <small>{detail}</small>}</div></Card>;
}

export function SourceBadge({ sourceType, year }: { sourceType: SourceType; year?: number }) {
  const text = sourceType === "PYQ" ? `PYQ${year ? ` • ${year}` : ""}` : sourceType;
  return <span className={`badge source-${sourceType.toLowerCase()}`}>{text}</span>;
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) { return <span className={`badge difficulty-${difficulty.toLowerCase()}`}>{difficulty}</span>; }

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <div className="empty-state"><Circle size={32} /><h3>{title}</h3><p>{text}</p>{action}</div>; }

export function StatusIcon({ status }: { status: "correct" | "incorrect" | "unattempted" | "partial" }) {
  if (status === "correct") return <CheckCircle2 size={18} className="status-correct" />;
  if (status === "partial") return <Flag size={18} className="status-partial" />;
  if (status === "incorrect") return <span className="status-incorrect">×</span>;
  return <Clock3 size={18} className="status-unattempted" />;
}

export function BookmarkButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return <button className={`icon-button ${active ? "bookmarked" : ""}`} onClick={onClick} aria-label={active ? "Remove bookmark" : "Bookmark question"}><Bookmark size={18} fill={active ? "currentColor" : "none"} /></button>;
}
