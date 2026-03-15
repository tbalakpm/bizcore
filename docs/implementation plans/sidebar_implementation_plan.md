# Implementation Plan: Sidebar Toggle & Resizing

## Goal Description
Introduce a professional sidebar menu experience that includes smooth expand/collapse toggling and user-controlled resizing (drag-to-resize). The current sidebar lacks both collapsed state management and width adjustability.

## Proposed Changes

### Frontend App Component

#### [MODIFY] `app.ts` (file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/app.ts)
- Import `HostListener` from `@angular/core`.
- Add signals for sidebar state: `isSidebarCollapsed = signal(false)`, `sidebarWidth = signal(260)`, and `isResizing = signal(false)`.
- Implement `toggleSidebar()` to flip the collapsed state.
- Implement `@HostListener('document:mousemove')` and `@HostListener('document:mouseup')` to handle the drag events.
- Implement `startResizing(event)` which will be called from the drag handle in the template.
- Optionally save/restore `sidebarWidth` and `isSidebarCollapsed` in `localStorage` so the user's preference persists.

#### [MODIFY] `app.html` (file:///Users/tbalamurugan/Projects/fanda-org/bizcore/frontend/src/app/app.html)
- **Header**: Add a hamburger menu toggle button near the app logo/title to trigger `toggleSidebar()`.
- **Sidebar Container (`<aside>`)**:
  - Add dynamic explicit width: `[style.width.px]="isSidebarCollapsed() ? 64 : sidebarWidth()"`.
  - Add classes for smooth width transitions when *not* resizing (`transition-all duration-300`, etc.), but disable transition during drag for snappiness.
  - Set `position: relative` (or add `relative` class).
  - Hide/truncate text items natively or with utility classes (like `hidden group-[.collapsed]:block` etc) when `isSidebarCollapsed()` is true.
- **Drag Handle**:
  - Add a thin `<div (mousedown)="startResizing($event)">` on the absolute right edge of the `<aside>` to act as the resizer. Provide hover styling to indicate it is draggable (`cursor-col-resize`, a subtle border highlight).

## Verification Plan

### Manual Verification
1. Run the local dev server (`npm run dev` or equivalent) and open the app in the browser.
2. Verify clicking the new hamburger toggle successfully collapses and expands the sidebar, leaving only icons visible when collapsed.
3. Verify that hovering on the right edge of the expanded sidebar shows a drag handle/cursor change.
4. Verify that dragging the handle adjusts the sidebar width up to reasonable min/max limits smoothly.
5. Verify preference (collapsed status or custom width) persists across browser refreshes (if localStorage implementation is included).
