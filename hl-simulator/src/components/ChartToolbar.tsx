"use client";

import { cn } from "@/lib/utils";

// SVG icons - exact copies from TradingView/Hyperliquid toolbar (18x18 size)

// 1. Crosshair with L-frame
const CrosshairIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M5 5h2v18h18v2H5V5z"></path>
    <path d="M12 13v-2h2V9h2v2h2v2h-2v2h-2v-2h-2z"></path>
  </svg>
);

// 2. Cursor/Arrow
const CursorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M11.682 24.613L9.382 18.505 5.167 22.151 5.139 6.17 20.611 16.627 13.844 17.641 17.038 25.362z"></path>
  </svg>
);

// 3. Trend Line with arrows
const TrendLineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M5.67 19.14l12.32-11.74.69.72L6.36 19.86z"></path>
    <path d="M7.97 19.49L4.09 19.6 4.2 15.72z"></path>
    <path d="M19.44 12.33l3.88-.11-.11 3.88z"></path>
  </svg>
);

// 4. Horizontal Ray
const HorizontalRayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M8 15h16v-2H8z"></path>
    <circle cx="6" cy="14" r="3" stroke="currentColor" strokeWidth="2" fill="none"></circle>
  </svg>
);

// 5. Fib Retracement - 3 horizontal lines
const FibRetracementIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M4 7h20v1H4zM4 13.5h20v1H4zM4 20h20v1H4z"></path>
  </svg>
);

// 6. Long Position tool
const LongPositionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M5 6h18v1H5zM5 21h18v1H5z"></path>
    <rect x="7" y="10" width="6" height="7" stroke="currentColor" strokeWidth="1" fill="none"></rect>
    <path d="M10 8v4M8 10l2-2 2 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

// 7. Price Range / Projection
const PriceRangeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M5 6h18v1H5zM5 21h18v1H5z"></path>
    <path d="M14 9v10" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
    <path d="M11 12l3-3 3 3M11 16l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

// 8. Brush/Path tool
const BrushIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M6.54 22.66c-.68-.69-1.04-1.6-1.04-2.51 0-.96.37-1.85 1.04-2.52l8.47-8.47 5.03 5.03-8.47 8.47c-.68.68-1.57 1.04-2.52 1.04-.94 0-1.83-.37-2.51-1.04zm13.91-13.91l-2.9-2.9L19.43 4 24 8.57l-1.85 1.88-1.7-1.7z"></path>
  </svg>
);

// 9. Text T
const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M7 7h14v3h-1V8H15v12h2v1h-6v-1h2V8H8v2H7V7z"></path>
  </svg>
);

// 10. Sticker/Emoji
const EmojiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"></circle>
    <circle cx="10.5" cy="12" r="1.5"></circle>
    <circle cx="17.5" cy="12" r="1.5"></circle>
    <path d="M10 17c1 1.5 2.5 2.5 4 2.5s3-1 4-2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"></path>
  </svg>
);

// 11. Eraser
const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M4 23h20v1H4z"></path>
    <path d="M9.41 20.41l-4.24-4.24a2 2 0 010-2.83L14.83 3.68a2 2 0 012.83 0l4.24 4.24a2 2 0 010 2.83L12.24 20.41H9.41z"></path>
    <path d="M12 21L5 14" stroke="#131722" strokeWidth="2"></path>
  </svg>
);

// 12. Zoom In
const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none"></circle>
    <path d="M17 17l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
    <path d="M9.5 12h5M12 9.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
  </svg>
);

// 13. Magnet
const MagnetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M4 4h6v2H6v10a8 8 0 0016 0V6h-4V4h6v12c0 5.52-4.48 10-10 10S4 21.52 4 16V4z"></path>
    <path d="M4 8h6v2H4zM18 8h6v2h-6z"></path>
  </svg>
);

// 14. Stay in Drawing Mode
const StayInDrawingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M5.54 21.66c-.58-.59-.89-1.37-.89-2.15 0-.78.31-1.58.89-2.16l7.25-7.25 4.31 4.31-7.25 7.25c-.58.58-1.37.89-2.16.89-.78 0-1.56-.32-2.15-.89z"></path>
    <path d="M17 5l3 3-2 2-3-3 2-2z"></path>
  </svg>
);

// 15. Lock
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <rect x="7" y="12" width="14" height="11" rx="1"></rect>
    <path d="M10 12V9a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" fill="none"></path>
  </svg>
);

// 16. Eye/Visibility
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M14 7C8 7 4 12 3 14c1 2 5 7 11 7s10-5 11-7c-1-2-5-7-11-7z" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
    <circle cx="14" cy="14" r="3.5"></circle>
  </svg>
);

// 17. Trash
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
    <path d="M8 8v13a2 2 0 002 2h8a2 2 0 002-2V8H8z"></path>
    <path d="M6 6h16v2H6z"></path>
    <path d="M11 4h6v2h-6z"></path>
  </svg>
);

// TradingView Logo
const TradingViewLogo = () => (
  <svg width="25" height="15" viewBox="0 0 36 28" className="text-[#2962FF]">
    <path d="M14 22H7V11H0V4h14v18zm8-12h7v12h-7V10zm0-6h7v4h-7V4zm-8 0h7v18h-7V4z" fill="currentColor"/>
  </svg>
);

// Toolbar items - exact order from Hyperliquid
const TOOLBAR_ITEMS = [
  { id: "crosshair", Icon: CrosshairIcon, title: "Crosshair" },
  { id: "cursor", Icon: CursorIcon, title: "Cursor" },
  { id: "divider1", divider: true },
  { id: "trendline", Icon: TrendLineIcon, title: "Trend Line" },
  { id: "hline", Icon: HorizontalRayIcon, title: "Horizontal Line" },
  { id: "fib", Icon: FibRetracementIcon, title: "Fib Retracement" },
  { id: "divider2", divider: true },
  { id: "longposition", Icon: LongPositionIcon, title: "Long Position" },
  { id: "brush", Icon: BrushIcon, title: "Brush" },
  { id: "text", Icon: TextIcon, title: "Text" },
  { id: "divider3", divider: true },
  { id: "emoji", Icon: EmojiIcon, title: "Sticker" },
  { id: "divider4", divider: true },
  { id: "eraser", Icon: EraserIcon, title: "Eraser" },
  { id: "zoom", Icon: ZoomIcon, title: "Zoom In" },
  { id: "divider5", divider: true },
  { id: "magnet", Icon: MagnetIcon, title: "Magnet Mode" },
  { id: "stayindrawing", Icon: StayInDrawingIcon, title: "Stay in Drawing Mode" },
  { id: "lock", Icon: LockIcon, title: "Lock All Drawings" },
  { id: "visible", Icon: EyeIcon, title: "Hide All Drawings" },
  { id: "divider6", divider: true },
  { id: "trash", Icon: TrashIcon, title: "Remove All Drawings" },
];

export function ChartToolbar() {
  return (
    <div className="flex flex-col h-full bg-[#0f1a1f] border-r border-[#1e2d36] w-[39px] flex-shrink-0">
      {/* Scrollable icons area */}
      <div className="flex-1 flex flex-col items-center pt-[2px] overflow-y-auto scrollbar-hide">
        {TOOLBAR_ITEMS.map((item) =>
          item.divider ? (
            <div key={item.id} className="w-[22px] h-px bg-[#2a3942] my-[2px] flex-shrink-0" />
          ) : (
            <button
              key={item.id}
              title={item.title}
              className={cn(
                "w-[26px] h-[26px] flex items-center justify-center text-[#758696] hover:text-[#d1d4dc] rounded transition-colors flex-shrink-0",
                item.id === "crosshair" && "text-[#d1d4dc] bg-[#1e2d36]"
              )}
            >
              {item.Icon && <item.Icon />}
            </button>
          )
        )}
      </div>

      {/* TradingView logo fixed at bottom */}
      <div className="flex-shrink-0 flex items-center justify-center py-2">
        <TradingViewLogo />
      </div>
    </div>
  );
}
