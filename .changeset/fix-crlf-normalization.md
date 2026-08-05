---
"leadtype": patch
---

Normalize CRLF line endings at every read site so emitted `.md` mirrors and `paths.lock.json` hashes are byte-identical on Windows and Linux.

Previously, source files checked out with `\r\n` line endings (common on Windows) caused `\r` bytes to survive into fenced code blocks and included file content, making `hashRedirectContent` values platform-dependent and causing `paths.lock.json` to drift between contributors.

**Affected read sites:**
- `convert.ts` — primary MDX source read (`convertMdxFile` / `convertAllMdx` / `createDocsSource`)
- `include.remark.ts` — `<include>` partial reads (uncached async, cached async, and synchronous)
- `llm/skills.ts` — skill `bodyPath` reads (affects `SKILL.md` `integrity`/`digest` hashes)
