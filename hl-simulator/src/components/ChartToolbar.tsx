"use client";

import { cn } from "@/lib/utils";

/**
 * Chart left sidebar toolbar — exact SVGs extracted from real Hyperliquid TradingView.
 * Width: 52px, bg: #0f1a1f. Buttons: 52x36px. Icons: 28x28 viewBox.
 * Colors: inactive #868993, active/hover #d1d4dc. Separators: 1px, #2a3740.
 * 16 icons + 3 dividers extracted directly from HL DOM.
 */

// ─── Exact SVGs from real Hyperliquid TradingView iframe DOM ───

// 0. Crosshair/Cursor
const Icon0 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><g fill="currentColor"><path d="M18 15h8v-1h-8z"></path><path d="M14 18v8h1v-8zM14 3v8h1v-8zM3 15h8v-1h-8z"></path></g></svg>
);

// 1. Trend Line
const Icon1 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><g fill="currentColor" fillRule="nonzero"><path d="M7.354 21.354l14-14-.707-.707-14 14z"></path><path d="M22.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path></g></svg>
);

// 2. Gann/Fibonacci (horizontal lines with dots)
const Icon2 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><g fill="currentColor" fillRule="nonzero"><path d="M3 5h22v-1h-22z"></path><path d="M3 17h22v-1h-22z"></path><path d="M3 11h19.5v-1h-19.5z"></path><path d="M5.5 23h19.5v-1h-19.5z"></path><path d="M3.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM24.5 12c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path></g></svg>
);

// 3. Patterns (XABCD wave with dots)
const Icon3 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><g fill="currentColor" fillRule="nonzero"><path d="M20.449 8.505l2.103 9.112.974-.225-2.103-9.112zM13.943 14.011l7.631 4.856.537-.844-7.631-4.856zM14.379 11.716l4.812-3.609-.6-.8-4.812 3.609zM10.96 13.828l-4.721 6.744.819.573 4.721-6.744zM6.331 20.67l2.31-13.088-.985-.174-2.31 13.088zM9.041 7.454l1.995 3.492.868-.496-1.995-3.492z"></path><path d="M8.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM12.5 14c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM20.5 8c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM22.5 20c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path></g></svg>
);

// 4. Prediction (dots with dashed diagonal lines)
const Icon4 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4.5 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2 6.5A2.5 2.5 0 0 1 6.95 6H24v1H6.95A2.5 2.5 0 0 1 2 6.5zM4.5 15a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2 16.5a2.5 2.5 0 0 1 4.95-.5h13.1a2.5 2.5 0 1 1 0 1H6.95A2.5 2.5 0 0 1 2 16.5zM22.5 15a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-18 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2 22.5a2.5 2.5 0 0 1 4.95-.5H24v1H6.95A2.5 2.5 0 0 1 2 22.5z"></path><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M22.4 8.94l-1.39.63-.41-.91 1.39-.63.41.91zm-4 1.8l-1.39.63-.41-.91 1.39-.63.41.91zm-4 1.8l-1.4.63-.4-.91 1.39-.63.41.91zm-4 1.8l-1.4.63-.4-.91 1.39-.63.41.91z"></path></svg>
);

// 5. Shapes (scissors/brush wave tool)
const Icon5 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><g fill="currentColor" fillRule="nonzero"><path d="M1.789 23l.859-.854.221-.228c.18-.19.38-.409.597-.655.619-.704 1.238-1.478 1.815-2.298.982-1.396 1.738-2.776 2.177-4.081 1.234-3.667 5.957-4.716 8.923-1.263 3.251 3.785-.037 9.38-5.379 9.38h-9.211zm9.211-1c4.544 0 7.272-4.642 4.621-7.728-2.45-2.853-6.225-2.015-7.216.931-.474 1.408-1.273 2.869-2.307 4.337-.599.852-1.241 1.653-1.882 2.383l-.068.078h6.853z"></path><path d="M18.182 6.002l-1.419 1.286c-1.031.935-1.075 2.501-.096 3.48l1.877 1.877c.976.976 2.553.954 3.513-.045l5.65-5.874-.721-.693-5.65 5.874c-.574.596-1.507.609-2.086.031l-1.877-1.877c-.574-.574-.548-1.48.061-2.032l1.419-1.286-.672-.741z"></path></g></svg>
);

// 6. Text annotation (T)
const Icon6 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" d="M8 6.5c0-.28.22-.5.5-.5H14v16h-2v1h5v-1h-2V6h5.5c.28 0 .5.22.5.5V9h1V6.5c0-.83-.67-1.5-1.5-1.5h-12C7.67 5 7 5.67 7 6.5V9h1V6.5Z"></path></svg>
);

// 7. Icons/Emoji (smiley)
const Icon7 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" d="M4.05 14a9.95 9.95 0 1 1 19.9 0 9.95 9.95 0 0 1-19.9 0ZM14 3a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm-3 13.03a.5.5 0 0 1 .64.3 2.5 2.5 0 0 0 4.72 0 .5.5 0 0 1 .94.34 3.5 3.5 0 0 1-6.6 0 .5.5 0 0 1 .3-.64Zm.5-4.53a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"></path></svg>
);

// 8. Measure (ruler)
const Icon8 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path fill="currentColor" d="M2 9.75a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h24a1.5 1.5 0 0 0 1.5-1.5v-5.5a1.5 1.5 0 0 0-1.5-1.5zm0 1h3v2.5h1v-2.5h3.25v3.9h1v-3.9h3.25v2.5h1v-2.5h3.25v3.9h1v-3.9H22v2.5h1v-2.5h3a.5.5 0 0 1 .5.5v5.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-5.5a.5.5 0 0 1 .5-.5z" transform="rotate(-45 14 14)"></path></svg>
);

// 9. Zoom In (magnifier +)
const Icon9 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor"><path d="M17.646 18.354l4 4 .708-.708-4-4z"></path><path d="M12.5 21a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17zm0-1a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"></path><path d="M9 13h7v-1H9z"></path><path d="M13 16V9h-1v7z"></path></svg>
);

// 10. Magnet Mode
const Icon10 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><g fill="currentColor" fillRule="evenodd"><path fillRule="nonzero" d="M14 10a2 2 0 0 0-2 2v11H6V12c0-4.416 3.584-8 8-8s8 3.584 8 8v11h-6V12a2 2 0 0 0-2-2zm-3 2a3 3 0 0 1 6 0v10h4V12c0-3.864-3.136-7-7-7s-7 3.136-7 7v10h4V12z"></path><path d="M6.5 18h5v1h-5zm10 0h5v1h-5z"></path></g></svg>
);

// 11. Stay in Drawing Mode (pencil + palette)
const Icon11 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" d="M17.27 4.56a2.5 2.5 0 0 0-3.54 0l-.58.59-9 9-1 1-.15.14V20h4.7l.15-.15 1-1 9-9 .59-.58a2.5 2.5 0 0 0 0-3.54l-1.17-1.17Zm-2.83.7a1.5 1.5 0 0 1 2.12 0l1.17 1.18a1.5 1.5 0 0 1 0 2.12l-.23.23-3.3-3.29.24-.23Zm-.94.95 3.3 3.29-8.3 8.3-3.3-3.3 8.3-8.3Zm-9 9 3.3 3.29-.5.5H4v-3.3l.5-.5Zm16.5.29a1.5 1.5 0 0 0-3 0V18h4.5c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-4c0-.83.67-1.5 1.5-1.5H21v-2.5Zm-4 3v4c0 .28.22.5.5.5h6a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0-.5.5Zm1.5 1a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1Zm2 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1Zm2 0a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1Z"></path></svg>
);

// 12. Lock All Drawings
const Icon12 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" fillRule="evenodd" d="M14 6a3 3 0 0 0-3 3v3h8.5a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 6 21.5v-7A2.5 2.5 0 0 1 8.5 12H10V9a4 4 0 0 1 8 0h-1a3 3 0 0 0-3-3zm-1 11a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0v-2zm-6-2.5c0-.83.67-1.5 1.5-1.5h11c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5h-11A1.5 1.5 0 0 1 7 21.5v-7z"></path></svg>
);

// 13. Hide All Drawings (eye)
const Icon13 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path fill="currentColor" fillRule="evenodd" d="M5 10.76l-.41-.72-.03-.04.03-.04a15 15 0 012.09-2.9c1.47-1.6 3.6-3.12 6.32-3.12 2.73 0 4.85 1.53 6.33 3.12a15.01 15.01 0 012.08 2.9l.03.04-.03.04a15 15 0 01-2.09 2.9c-1.47 1.6-3.6 3.12-6.32 3.12-2.73 0-4.85-1.53-6.33-3.12a15 15 0 01-1.66-2.18zm17.45-.98L22 10l.45.22-.01.02a5.04 5.04 0 01-.15.28 16.01 16.01 0 01-1.98 2.8c-1.52 1.67-3.5 3.02-5.91 3.02h-.8c-2.4 0-4.4-1.35-5.9-3.01a16 16 0 01-2.14-3.11 16 16 0 012.13-3.1C9.2 4.44 11.2 3.1 13.6 3.1h.8c2.4 0 4.4 1.35 5.9 3.01a16 16 0 011.98 2.81l.15.28.01.02v.01l.01.01zM13 10a1 1 0 112 0 1 1 0 01-2 0zm1-2a2 2 0 100 4 2 2 0 000-4zm-3 2a3 3 0 116 0 3 3 0 01-6 0z" transform="translate(0 4)"></path></svg>
);

// 14. Remove All Drawings (trash)
const Icon14 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><path fill="currentColor" d="M18 7h5v1h-2.01l-1.33 14.64a1.5 1.5 0 0 1-1.5 1.36H9.84a1.5 1.5 0 0 1-1.49-1.36L7.01 8H5V7h5V6c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v1Zm-6-2a1 1 0 0 0-1 1v1h6V6a1 1 0 0 0-1-1h-4ZM8.02 8l1.32 14.54a.5.5 0 0 0 .5.46h8.33a.5.5 0 0 0 .5-.46L19.99 8H8.02Z"></path></svg>
);

// 15. Object Tree (layers)
const Icon15 = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28"><g fill="currentColor"><path fillRule="nonzero" d="M14 18.634l-.307-.239-7.37-5.73-2.137-1.665 9.814-7.633 9.816 7.634-.509.394-1.639 1.269-7.667 5.969zm7.054-6.759l1.131-.876-8.184-6.366-8.186 6.367 1.123.875 7.063 5.491 7.054-5.492z"></path><path d="M7 14.5l-1 .57 8 6.43 8-6.5-1-.5-7 5.5z"></path><path d="M7 17.5l-1 .57 8 6.43 8-6.5-1-.5-7 5.5z"></path></g></svg>
);

// Toolbar groups — exact layout from real HL DOM.
// Groups separated by 13px gap (6px pb + 7px spacing), no visible divider lines.
const TOOLBAR_GROUPS: { id: string; Icon: () => JSX.Element; title: string }[][] = [
  // Group 0: Drawing tools (8 icons, pt=6px pb=6px)
  [
    { id: "cursors", Icon: Icon0, title: "Cursors" },
    { id: "trend-line", Icon: Icon1, title: "Trend Line" },
    { id: "gann-fib", Icon: Icon2, title: "Gann and Fibonacci" },
    { id: "patterns", Icon: Icon3, title: "Patterns" },
    { id: "prediction", Icon: Icon4, title: "Prediction and Measurement" },
    { id: "shapes", Icon: Icon5, title: "Geometric Shapes" },
    { id: "annotation", Icon: Icon6, title: "Annotation" },
    { id: "font-icons", Icon: Icon7, title: "Icons" },
  ],
  // Group 1: Measure tools (2 icons)
  [
    { id: "measure", Icon: Icon8, title: "Measure" },
    { id: "zoom", Icon: Icon9, title: "Zoom In" },
  ],
  // Group 2: Drawing mode tools (4 icons)
  [
    { id: "magnet", Icon: Icon10, title: "Magnet Mode" },
    { id: "drawingmode", Icon: Icon11, title: "Stay in Drawing Mode" },
    { id: "lock", Icon: Icon12, title: "Lock All Drawings" },
    { id: "hideall", Icon: Icon13, title: "Hide All Drawings" },
  ],
];

export function ChartToolbar() {
  return (
    <div className="flex flex-col h-full bg-[#0f1a1f] w-[52px] flex-shrink-0">
      {/* Top groups: group 0 + divider + group 1 — pinned to top */}
      <div className="flex flex-col items-center pt-[6px] pb-[6px]">
        {TOOLBAR_GROUPS[0].map((item) => (
          <button
            key={item.id}
            title={item.title}
            className={cn(
              "w-[52px] h-[36px] flex items-center justify-center text-[#d1d4dc] hover:text-white transition-colors",
              item.id === "cursors" && "text-[#50D2C1]"
            )}
          >
            <item.Icon />
          </button>
        ))}
      </div>
      {/* Divider line */}
      <div className="flex justify-center py-[2px]"><div className="w-[36px] h-[2px] bg-[#2a3740] rounded-full" /></div>
      <div className="flex flex-col items-center pt-[6px] pb-[6px]">
        {TOOLBAR_GROUPS[1].map((item) => (
          <button
            key={item.id}
            title={item.title}
            className="w-[52px] h-[36px] flex items-center justify-center text-[#d1d4dc] hover:text-white transition-colors"
          >
            <item.Icon />
          </button>
        ))}
      </div>
      {/* Divider line */}
      <div className="flex justify-center py-[2px]"><div className="w-[36px] h-[2px] bg-[#2a3740] rounded-full" /></div>
      {/* Spacer pushes last group to bottom */}
      <div className="flex-1" />
      {/* Bottom group: pinned to bottom */}
      <div className="flex flex-col items-center pb-[6px]">
        {TOOLBAR_GROUPS[2].map((item) => (
          <button
            key={item.id}
            title={item.title}
            className="w-[52px] h-[36px] flex items-center justify-center text-[#d1d4dc] hover:text-white transition-colors"
          >
            <item.Icon />
          </button>
        ))}
      </div>
    </div>
  );
}
