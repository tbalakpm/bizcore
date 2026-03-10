# Task Title

[Short name]

     ## 1) Goal
     [What should be built/fixed? Why?]

     ## 2) Scope
     - In scope:
       - [file/path/module/page]
     - Out of scope:
       - [what should NOT be changed]

     ## 3) Functional Requirements
     - [Requirement 1]
     - [Requirement 2]
     - Edge cases:
       - [case + expected behavior]

     ## 4) Data / Database (if applicable)
     - Schema changes:
       - [table/column/index/constraints]
     - Migration requirements:
       - [forward/rollback, backfill, compatibility]

     ## 5) API Contract (if applicable)
     - Endpoint: `[METHOD] /path`
     - Auth: [public/auth/admin]
     - Request body/query:
       ```json
       {}

• Success response:

json
{}

• Error responses:
• 400: [reason]
• 401/403: [reason]
• 404: [reason]

6.  UI / UX (if applicable)
    • Screens/components:
    • [list]
    • Behavior:
    • [button actions, form validation, loading/empty/error states]
    • Theming:
    • [light/dark expectations]
    • Design refs:
    • [Figma/screenshot/link]

7.  Non-Functional Requirements
    • Performance: [limits/targets]
    • Security: [RBAC, validation, secrets, audit]
    • Reliability: [retry, idempotency, transaction needs]
    • Logging/monitoring: [what to log, what not to log]

8.  Constraints
    • Must use:
    • [library/pattern]
    • Must not use:
    • [library/pattern]
    • Backward compatibility:
    • [required? how long?]

9.  Acceptance Criteria
    [ ] [clear testable outcome 1]
    [ ] [clear testable outcome 2]
    [ ] Build/tests/lint pass:
    • [commands]

10. Deliverables
    • Code changes in:
    • [paths]
    • Migration files:
    • [yes/no + names]
    • Notes:
    • [anything you want summarized]
