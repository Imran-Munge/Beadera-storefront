---
name: Generated client DOM iterable types
description: The generated API client uses Headers.entries(), so its composite TypeScript config needs DOM iterable types.
---

The shared generated browser client requires both `dom` and `dom.iterable` in its TypeScript `lib` list.

**Why:** Orval emits response-header helpers that call `Headers.entries()`, which is not included by the base `dom` library alone.

**How to apply:** If generated client typechecks start failing on `Headers.entries`, check the client package compiler libs before changing generated output.