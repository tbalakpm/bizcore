# Development Rules & Standards

To maintain consistency and quality across the BizCore codebase, all AI agents and developers should follow these rules.

## Core Principles
1. **Premium Design**: All UI changes must follow premium design aesthetics (gradients, smooth transitions, modern typography).
2. **Type Safety**: Use TypeScript strictly. Avoid `any`. Use Drizzle's `$inferSelect` and `$inferInsert` for database types.
3. **No Placeholders**: Never use "lorem ipsum" or placeholder images. Use `generate_image` for realistic assets.
4. **Consistency**: Follow existing patterns for routes, services, and components.

## Backend Standards (Node/Express/Drizzle)
- **Naming**: 
  - Database tables and columns: `snake_case`.
  - Variables and functions: `camelCase`.
  - Files: `kebab-case.ts`.
- **Database**:
  - Use Drizzle ORM for all queries.
  - Every table must have `id` (PK), `isActive` (boolean), `createdAt`, and `updatedAt`.
  - Foreign keys should use `onDelete('cascade')` where appropriate.
- **API**:
  - Use `authRequired` middleware for protected routes.
  - Use `req.i18n.t()` for all user-facing strings (errors, notifications).
  - Centralize route registration in `app.ts`.

## Frontend Standards (Angular 20)
- **Architecture**:
  - Use **Standalone Components** only.
  - Use **Signals** (`signal`, `computed`, `effect`) for state management instead of traditional observables where possible.
  - Use the `inject()` function for dependency injection.
- **Styling**:
  - Use TailwindCSS 4.x.
  - Prefer utility classes but maintain a clean template.
  - Ensure dark mode compatibility for all components.
- **Forms**:
  - Use Reactive Forms for complex data entry.
  - Implement real-time validation feedback.

## AI Guidelines
- When generating code, ensure it aligns with the existing architecture.
- Follow the `.factory/SCHEMA.md` accurately when writing SQL/Drizzle queries.
- Refer to `.factory/API.md` for existing endpoint structures.
