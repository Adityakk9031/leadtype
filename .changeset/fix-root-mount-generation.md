---
"leadtype": patch
---

Support root-mounted Markdown mirrors without deleting primary docs, other mounts, or unrelated Markdown files in the output directory. Track generated mirrors outside the published directory and prune only previously generated files whose content is unchanged. Files left by older releases without ownership records are preserved.
