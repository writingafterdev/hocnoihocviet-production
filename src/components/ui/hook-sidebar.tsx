"use client";

// Hook Sidebar from Rare UI (https://www.rareui.com/components/hooksidebar), MIT with the Commons Clause and an
// attribution requirement: keep this notice and the visible credit link to rareui.com (see AppCredits).

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const CORNER = 6;
const DASH =
  "repeating-linear-gradient(to top, transparent 0 2px, currentColor 2px 4px)";

export type HookSidebarItem = string | { label: string; href?: string; icon?: ReactNode; /** Shown but not usable yet. */ disabled?: boolean };

export type HookSidebarProps = Omit<ComponentProps<"nav">, "onChange"> & {
  items: HookSidebarItem[];
  label?: string;
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  color?: string;
  dashed?: boolean;
  /** A smaller, sentence-case heading for a group nested under another one. */
  sub?: boolean;
  /** Sits after the heading (a status chip, for instance). */
  labelSuffix?: ReactNode;
};

const hrefOf = (item: HookSidebarItem) =>
  typeof item === "string" ? undefined : item.href;

const labelOf = (item: HookSidebarItem) =>
  typeof item === "string" ? item : item.label;

const disabledOf = (item: HookSidebarItem) =>
  typeof item === "string" ? false : !!item.disabled;

const iconOf = (item: HookSidebarItem) =>
  typeof item === "string" ? undefined : item.icon;

const Rail = ({
  from = 0,
  y,
  visible,
  color,
  dashed,
  className,
}: {
  from?: number;
  y: number | null;
  visible: boolean;
  color?: string;
  dashed: boolean;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  const travel = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.7 };

  return (
    <motion.span
      aria-hidden
      initial={false}
      style={{ color }}
      animate={{ opacity: visible && y !== null ? 1 : 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.2 }}
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <motion.span
        initial={false}
        animate={{ top: from, height: Math.max(0, (y ?? 0) - CORNER - from) }}
        transition={travel}
        style={
          dashed
            ? { backgroundImage: DASH }
            : { backgroundColor: "currentColor" }
        }
        className="absolute left-0.5 w-px"
      />
      <motion.svg
        initial={false}
        animate={{ top: (y ?? 0) - CORNER }}
        transition={travel}
        width="12"
        height="7"
        viewBox="0 0 12 7"
        fill="none"
        className="absolute left-0.5"
      >
        <path
          d="M0.5 0a6 6 0 0 0 6 6H12"
          stroke="currentColor"
          strokeDasharray={dashed ? "2 2" : undefined}
        />
      </motion.svg>
    </motion.span>
  );
};

export function HookSidebar({
  items,
  label,
  value,
  defaultValue = 0,
  onChange,
  color = "#FC4C01",
  dashed = true,
  sub = false,
  labelSuffix,
  className,
  ...props
}: HookSidebarProps) {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [centers, setCenters] = useState<number[]>([]);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);

  const routed = items.some((item) => hrefOf(item));
  const routeIndex = items.findIndex((item) => hrefOf(item) === pathname);
  const activeIndex = value ?? (routed ? routeIndex : internalValue);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () =>
      setCenters(
        itemRefs.current.map((el) =>
          el ? el.offsetTop + el.offsetHeight / 2 : 0,
        ),
      );

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items.length]);

  const activeY = activeIndex < 0 ? null : (centers[activeIndex] ?? null);
  const hoverY = hoverIndex === null ? null : (centers[hoverIndex] ?? null);

  // above the active row the accent line already covers the span, so draw only the corner
  const hoverFrom =
    activeY !== null && hoverY !== null && hoverY <= activeY
      ? Math.max(0, hoverY - CORNER)
      : (activeY ?? 0);

  const select = (index: number) => {
    if (value === undefined) setInternalValue(index);
    onChange?.(index);
  };

  return (
    <nav
      data-slot="hook-sidebar"
      aria-label={label}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {label && (
        <span
          data-slot="hook-sidebar-label"
          className={cn(
            "flex items-center gap-2 pl-0.5 pr-2 font-sans font-medium",
            sub ? "pb-2 text-[13px] text-foreground/70" : "pb-3 text-sm uppercase tracking-wide text-foreground",
          )}
        >
          {label}
          {labelSuffix}
        </span>
      )}

      <div
        ref={listRef}
        onMouseLeave={() => setPointerInside(false)}
        className="relative flex flex-col gap-0.5"
      >
        {centers.length > 0 && (
          <span aria-hidden className="pointer-events-none absolute inset-0 text-foreground/25">
            <span
              className="absolute left-0.5 w-px"
              style={{ top: 0, height: Math.max(0, (centers[centers.length - 1] ?? 0) - CORNER), ...(dashed ? { backgroundImage: DASH } : { backgroundColor: "currentColor" }) }}
            />
            {centers.map((c, i) => (
              <svg key={i} width="12" height="7" viewBox="0 0 12 7" fill="none" className="absolute left-0.5" style={{ top: c - CORNER }}>
                <path d="M0.5 0a6 6 0 0 0 6 6H12" stroke="currentColor" strokeDasharray={dashed ? "2 2" : undefined} />
              </svg>
            ))}
          </span>
        )}
        <Rail
          from={hoverFrom}
          y={hoverY}
          visible={(pointerInside || focusInside) && hoverIndex !== activeIndex}
          dashed={dashed}
          className="text-foreground/30"
        />
        <Rail
          y={activeY}
          visible={activeY !== null}
          color={color}
          dashed={dashed}
        />

        {items.map((item, index) => {
          const text = labelOf(item);
          const href = hrefOf(item);
          const isActive = index === activeIndex;
          const setRef = (el: HTMLElement | null) => {
            itemRefs.current[index] = el;
          };
          const rowProps = {
            "data-slot": "hook-sidebar-item",
            "data-active": isActive,
            onMouseEnter: () => {
              setHoverIndex(index);
              setPointerInside(true);
            },
            onFocus: () => {
              setHoverIndex(index);
              setFocusInside(true);
            },
            onBlur: () => setFocusInside(false),
            onClick: () => select(index),
            className: cn(
              "flex items-center gap-2.5 rounded-lg py-1.5 pl-5 pr-2 text-left text-sm transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
              isActive
                ? "bg-black/[0.045] font-medium text-foreground"
                : "text-foreground/50 hover:bg-black/[0.03] hover:text-foreground/80",
            ),
          };

          if (disabledOf(item)) {
            return (
              <span
                key={`${index}-${text}`}
                ref={setRef}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-2.5 rounded-lg py-1.5 pl-5 pr-2 text-left text-sm text-foreground/35"
              >
                <span className="flex items-center gap-2.5 opacity-50 grayscale">{iconOf(item)}</span>
                {text}
              </span>
            );
          }

          return href ? (
            <Link
              key={`${index}-${text}`}
              {...rowProps}
              ref={setRef}
              href={href}
              aria-current={isActive ? "page" : undefined}
            >
              {iconOf(item)}
              {text}
            </Link>
          ) : (
            <button
              key={`${index}-${text}`}
              {...rowProps}
              ref={setRef}
              type="button"
              aria-current={isActive ? "true" : undefined}
            >
              {iconOf(item)}
              {text}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
