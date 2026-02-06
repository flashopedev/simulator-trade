"use client";

import { cn } from "@/lib/utils";
import {
  MousePointer2,
  Crosshair,
  TrendingUp,
  Minus,
  GitBranch,
  Pencil,
  Type,
  Square,
  Triangle,
  Ruler,
  ZoomIn,
  Magnet,
  Lock,
  Eye,
  Trash2,
  MoreHorizontal
} from "lucide-react";

// Chart toolbar matching real Hyperliquid left sidebar
const TOOLBAR_ITEMS = [
  { id: "crosshair", Icon: Crosshair, title: "Crosshair" },
  { id: "cursor", Icon: MousePointer2, title: "Cursor" },
  { id: "divider1", divider: true },
  { id: "trendline", Icon: TrendingUp, title: "Trend Line" },
  { id: "hline", Icon: Minus, title: "Horizontal Line" },
  { id: "fib", Icon: GitBranch, title: "Fibonacci" },
  { id: "divider2", divider: true },
  { id: "brush", Icon: Pencil, title: "Brush" },
  { id: "text", Icon: Type, title: "Text" },
  { id: "shapes", Icon: Square, title: "Shapes" },
  { id: "patterns", Icon: Triangle, title: "Patterns" },
  { id: "divider3", divider: true },
  { id: "measure", Icon: Ruler, title: "Measure" },
  { id: "zoom", Icon: ZoomIn, title: "Zoom" },
  { id: "magnet", Icon: Magnet, title: "Magnet Mode" },
  { id: "divider4", divider: true },
  { id: "lock", Icon: Lock, title: "Lock" },
  { id: "visible", Icon: Eye, title: "Visible" },
  { id: "trash", Icon: Trash2, title: "Delete All" },
];

export function ChartToolbar() {
  return (
    <div className="flex flex-col items-center py-1.5 bg-s1 border-r border-brd w-[44px] flex-shrink-0 overflow-y-auto scrollbar-hide">
      {TOOLBAR_ITEMS.map((item) =>
        item.divider ? (
          <div key={item.id} className="w-6 h-px bg-brd my-1.5" />
        ) : (
          <button
            key={item.id}
            title={item.title}
            className={cn(
              "w-7 h-7 flex items-center justify-center text-t3 hover:text-t1 hover:bg-s2 rounded transition-colors my-0.5",
              item.id === "crosshair" && "text-acc bg-s2"
            )}
          >
            {item.Icon && <item.Icon className="w-4 h-4" />}
          </button>
        )
      )}
    </div>
  );
}
