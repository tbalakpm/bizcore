---
status: complete
priority: p3
issue_id: "004"
tags: [code-review, security, frontend, deployment]
dependencies: []
---

## Problem Statement
Generated `index.html` uses inline `onload` on stylesheet links. This is generally safe in this context, but may conflict with stricter CSP policies that disallow inline handlers.

## Findings
- Evidence: `backend/src/public/index.html` contains `onload="this.media='all'"` on CSS link.
- Impact: Potential deployment friction under strict CSP, not an immediate vulnerability.
- Source: security-sentinel.

## Proposed Solutions
### Option 1: Keep current behavior and document CSP allowances (nonce/hash/unsafe-inline policy decision)
- Pros: no code changes
- Cons: CSP exceptions may be needed
- Effort: Small
- Risk: Medium

### Option 2: Adjust build/runtime to avoid inline handler pattern
- Pros: stronger CSP compatibility
- Cons: may require tooling/config changes
- Effort: Medium
- Risk: Low

### Option 3: Serve CSS without deferred `media=print` swap
- Pros: removes inline handler entirely
- Cons: possible render-performance tradeoff
- Effort: Small
- Risk: Low

## Recommended Action


## Technical Details
- Affected file: generated `backend/src/public/index.html`
- Scope: deployment security policy compatibility.

## Acceptance Criteria
- [ ] Decision made on CSP strategy for stylesheet loading pattern.
- [ ] Production CSP and build output are compatible.
- [ ] No runtime styling regressions after any change.

## Work Log
- 2026-03-03: Logged as informational security finding during review.

## Resources
- Review target: current branch uncommitted diff
