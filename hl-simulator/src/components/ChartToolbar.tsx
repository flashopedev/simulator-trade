"use client";

import { cn } from "@/lib/utils";

/**
 * Chart left sidebar toolbar — pixel-perfect replica of real Hyperliquid/TradingView.
 * Width: 52px, bg: rgb(15,26,31), no border-right.
 * Buttons: 52x36px each with small dropdown arrows.
 * Icons: 28x28 viewBox SVGs from TradingView, displayed at currentColor.
 * Colors: inactive rgb(134,137,147), active/hover rgb(209,212,220).
 * Separators: 1px height, ~28px wide, color rgb(42,55,63).
 */

// ─── SVGs extracted from real Hyperliquid TradingView (28x28 viewBox) ───

const CrosshairIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <g fill="currentColor">
      <path d="M18 15h8v-1h-8z"></path>
      <path d="M14 18v8h1v-8zM14 3v8h1v-8zM3 15h8v-1h-8z"></path>
    </g>
  </svg>
);

const TrendLineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <g fill="currentColor" fillRule="nonzero">
      <path d="M7.354 21.354l14-14-.707-.707-14 14z"></path>
      <path d="M22.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
    </g>
  </svg>
);

const FibRetracementIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <g fill="currentColor">
      <path d="M3 5h22v1H3zM3 14h22v1H3z"></path>
      <path d="M3 22h22v1H3z" fillOpacity=".4"></path>
      <path d="M3 9h22v1H3z" fillOpacity=".4"></path>
      <path d="M3 18h22v1H3z" fillOpacity=".4"></path>
    </g>
  </svg>
);

const PatternsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <g fill="currentColor">
      <path d="M5.5 6a.5.5 0 0 0-.5.5v15a.5.5 0 0 0 .5.5h17a.5.5 0 0 0 .5-.5v-15a.5.5 0 0 0-.5-.5h-17zM4 6.5A1.5 1.5 0 0 1 5.5 5h17A1.5 1.5 0 0 1 24 6.5v15a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 4 21.5v-15z"></path>
      <path d="M8 18l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
    </g>
  </svg>
);

const PredictionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <g fill="currentColor">
      <path d="M3 6h1v16H3zM24 6h1v16h-1z"></path>
      <path d="M4 13.5h20v1H4z"></path>
      <path d="M13.5 6v16h1V6z"></path>
    </g>
  </svg>
);

const ShapesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <g fill="currentColor">
      <path d="M5.5 7a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h17a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-17zM4 7.5A1.5 1.5 0 0 1 5.5 6h17A1.5 1.5 0 0 1 24 7.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 4 20.5v-13z"></path>
    </g>
  </svg>
);

const AnnotationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <g fill="currentColor">
      <path d="M7 7h14v3h-1V8H15v12h2v1h-6v-1h2V8H8v2H7V7z"></path>
    </g>
  </svg>
);

const FontIconsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1" fill="none"></circle>
    <circle cx="10.5" cy="12" r="1.5" fill="currentColor"></circle>
    <circle cx="17.5" cy="12" r="1.5" fill="currentColor"></circle>
    <path d="M10 17c1 1.5 2.5 2.5 4 2.5s3-1 4-2.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round"></path>
  </svg>
);

const MeasureIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <path fill="currentColor" d="M2 9.75a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h24a1.5 1.5 0 0 0 1.5-1.5v-5.5a1.5 1.5 0 0 0-1.5-1.5zm0 1h3v2.5h1v-2.5h3.25v3.9h1v-3.9h3.25v2.5h1v-2.5h3.25v3.9h1v-3.9H22v2.5h1v-2.5h3a.5.5 0 0 1 .5.5v5.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-5.5a.5.5 0 0 1 .5-.5z" transform="rotate(-45 14 14)"></path>
  </svg>
);

const ZoomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M17.646 18.354l4 4 .708-.708-4-4z"></path>
    <path d="M12.5 21a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17zm0-1a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"></path>
    <path d="M9 13h7v-1H9z"></path>
    <path d="M13 16V9h-1v7z"></path>
  </svg>
);

const MagnetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
    <g fill="currentColor" fillRule="evenodd">
      <path fillRule="nonzero" d="M14 10a2 2 0 0 0-2 2v4h-1v-4a3 3 0 1 1 6 0v4h-1v-4a2 2 0 0 0-2-2z"></path>
      <rect width="5" height="3" rx=".5" x="7" y="15"></rect>
      <rect width="5" height="3" rx=".5" x="16" y="15"></rect>
      <rect width="5" height="2" rx=".5" x="7" y="19"></rect>
      <rect width="5" height="2" rx=".5" x="16" y="19"></rect>
    </g>
  </svg>
);

const DrawingModeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M5.54 21.66c-.58-.59-.89-1.37-.89-2.15 0-.78.31-1.58.89-2.16l7.25-7.25 4.31 4.31-7.25 7.25c-.58.58-1.37.89-2.16.89-.78 0-1.56-.32-2.15-.89z"></path>
    <path d="M17 5l3 3-2 2-3-3 2-2z"></path>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M14 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"></path>
    <path d="M9 12V9a5 5 0 0 1 10 0v3h1.5a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5H9zm1 0h8V9a4 4 0 0 0-8 0v3zm-2 1v9h12v-9H8z"></path>
  </svg>
);

const HideAllIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M14 7C8 7 3 12 2 14c1 2 6 7 12 7s11-5 12-7c-1-2-6-7-12-7z" stroke="currentColor" strokeWidth="1" fill="none"></path>
    <circle cx="14" cy="14" r="3.5"></circle>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M18 7h-1V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v1H9.5a.5.5 0 0 0-.5.5V9h10V7.5a.5.5 0 0 0-.5-.5H18zM12 6h4v1h-4V6z"></path>
    <path d="M9 10v11.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V10H9zm3 1.5h1v8h-1v-8zm3 0h1v8h-1v-8z"></path>
  </svg>
);

const ObjectsTreeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M5 8h18v1H5zM5 13.5h18v1H5zM5 19h18v1H5z"></path>
  </svg>
);

// Dropdown arrow for tool groups (small triangle at bottom-right of button)
const DropdownArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 6 6" width="6" height="6" className="absolute bottom-[3px] right-[3px]">
    <path d="M0 6L6 6 6 0z" fill="currentColor" opacity="0.6"></path>
  </svg>
);

// TradingView Logo — matches real TV logo at bottom of toolbar
const TradingViewLogo = () => (
  <svg width="28" height="19" viewBox="0 0 36 28" className="text-[#2962FF]">
    <path d="M14 22H7V11H0V4h14v18zm8-12h7v12h-7V10zm0-6h7v4h-7V4zm-8 0h7v18h-7V4z" fill="currentColor"/>
  </svg>
);

// Toolbar items — exact order from real Hyperliquid TradingView (16 button groups)
const TOOLBAR_ITEMS: Array<{id: string; Icon?: () => JSX.Element; title: string; divider?: boolean; hasDropdown?: boolean}> = [
  { id: "cursors", Icon: CrosshairIcon, title: "Cursors", hasDropdown: true },
  { id: "trend-line", Icon: TrendLineIcon, title: "Trend Line", hasDropdown: true },
  { id: "gann-fibonacci", Icon: FibRetracementIcon, title: "Gann and Fibonacci", hasDropdown: true },
  { id: "patterns", Icon: PatternsIcon, title: "Patterns", hasDropdown: true },
  { id: "prediction", Icon: PredictionIcon, title: "Prediction and Measurement", hasDropdown: true },
  { id: "shapes", Icon: ShapesIcon, title: "Geometric Shapes", hasDropdown: true },
  { id: "annotation", Icon: AnnotationIcon, title: "Annotation", hasDropdown: true },
  { id: "font-icons", Icon: FontIconsIcon, title: "Icons", hasDropdown: true },
  { id: "divider1", divider: true, title: "" },
  { id: "measure", Icon: MeasureIcon, title: "Measure" },
  { id: "zoom", Icon: ZoomIcon, title: "Zoom In" },
  { id: "divider2", divider: true, title: "" },
  { id: "magnet", Icon: MagnetIcon, title: "Magnet Mode" },
  { id: "drawingmode", Icon: DrawingModeIcon, title: "Stay in Drawing Mode" },
  { id: "lock", Icon: LockIcon, title: "Lock All Drawings" },
  { id: "hideall", Icon: HideAllIcon, title: "Hide All Drawings" },
  { id: "divider3", divider: true, title: "" },
  { id: "trash", Icon: TrashIcon, title: "Remove All Drawings" },
  { id: "objects", Icon: ObjectsTreeIcon, title: "Object Tree" },
];

export function ChartToolbar() {
  return (
    <div className="flex flex-col h-full bg-[#0f1a1f] w-[52px] flex-shrink-0">
      {/* Scrollable icons area — starts 6px from top like real HL */}
      <div className="flex-1 flex flex-col items-center pt-[6px] overflow-y-auto scrollbar-hide">
        {TOOLBAR_ITEMS.map((item) =>
          item.divider ? (
            <div key={item.id} className="w-[28px] h-px bg-[#2a3740] my-[4px] flex-shrink-0" />
          ) : (
            <button
              key={item.id}
              title={item.title}
              className={cn(
                "relative w-[52px] h-[36px] flex items-center justify-center text-[#868993] hover:text-[#d1d4dc] transition-colors flex-shrink-0",
                item.id === "cursors" && "text-[#d1d4dc]"
              )}
            >
              {item.Icon && <item.Icon />}
              {item.hasDropdown && <DropdownArrow />}
            </button>
          )
        )}
      </div>

      {/* TradingView logo fixed at bottom — centered, with padding */}
      <div className="flex-shrink-0 flex items-center justify-center py-2 border-t border-[#2a3740]">
        <TradingViewLogo />
      </div>
    </div>
  );
}
