import Link from "next/link";
import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  Icon: LucideIcon;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}

export function EmptyState({
  Icon,
  title,
  description,
  ctaHref,
  ctaLabel = "Crear el primero",
  secondaryHref,
  secondaryLabel,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center px-6 py-12 sm:py-16",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-4">
        <Icon size={28} className="text-[var(--primary)]" />
      </div>
      <h3 className="font-bold text-lg text-[var(--secondary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-md mb-6">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 rounded-md font-semibold px-4 py-2 text-sm bg-[var(--primary)] text-white hover:opacity-90 cursor-pointer"
          >
            <Plus size={16} /> {ctaLabel}
          </Link>
        )}
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-md font-semibold px-4 py-2 text-sm border bg-white hover:bg-[var(--muted)] cursor-pointer"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
