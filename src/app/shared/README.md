# Shared overview

`shared/` contains reusable presentation and small framework-agnostic utilities. Shared code must be safe to consume from multiple features without importing feature stores, API services, or route-specific models.

## Contents

- `ui/` — standalone, OnPush UI components documented in [`ui/README.md`](ui/README.md).
- `utilities/` — small pure helpers such as search-term normalization, safe
  external-data narrowing, and shared HTTP error-message extraction.

## Reuse test

Before adding code here, ask:

1. Does it have at least two plausible consumers or a clearly reusable primitive API?
2. Can it render and behave without a feature store or HTTP request?
3. Can its inputs/outputs be expressed as a small typed signal API?
4. Is its accessibility contract independent of one feature's business rules?

If not, keep it in the owning feature. Shared components should receive data and emit intent; route navigation, API calls, and state transitions stay with their parent.
