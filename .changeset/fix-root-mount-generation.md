---
"leadtype": patch
---

Fix root mount (urlPrefix: "/") handling in leadtype generate and matchesUrlPrefix. copyMountedMarkdownMirrors now allows root-mounted mirrors without erroneously throwing output directory escape errors, preserves the primary docs directory during root-mirror pruning, and correctly matches root-prefixed URLs.
