import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { copyMountedMarkdownMirrors } from "./mounted-markdown";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  );
});

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "leadtype-mirror-"));
  roots.push(root);
  const outDir = path.join(root, "public");
  const stateDir = path.join(root, ".leadtype");
  await mkdir(path.join(outDir, "docs/changelog"), { recursive: true });
  await writeFile(path.join(outDir, "docs/index.md"), "Home");
  await writeFile(path.join(outDir, "docs/changelog/v1.md"), "Release one");
  return { outDir, stateDir };
}

it("preserves primary docs, sibling mounts, and unrelated markdown across repeated root generation", async () => {
  const { outDir, stateDir } = await fixture();
  await writeFile(path.join(outDir, "README.md"), "Host README");
  const mounts = [
    { pathPrefix: "", urlPrefix: "/" },
    { pathPrefix: "changelog", urlPrefix: "/releases" },
  ];
  for (const orderedMounts of [mounts, [...mounts].reverse()]) {
    await copyMountedMarkdownMirrors(outDir, orderedMounts, stateDir);
    expect(await readFile(path.join(outDir, "index.md"), "utf8")).toBe("Home");
    expect(await readFile(path.join(outDir, "docs/index.md"), "utf8")).toBe(
      "Home"
    );
    expect(await readFile(path.join(outDir, "releases/v1.md"), "utf8")).toBe(
      "Release one"
    );
    expect(await readFile(path.join(outDir, "README.md"), "utf8")).toBe(
      "Host README"
    );
  }
});

it("prunes removed mirrors but preserves files edited after generation", async () => {
  const { outDir, stateDir } = await fixture();
  const mounts = [{ pathPrefix: "", urlPrefix: "/" }];
  await copyMountedMarkdownMirrors(outDir, mounts, stateDir);
  await writeFile(path.join(outDir, "index.md"), "Host replacement");
  await rm(path.join(outDir, "docs/changelog/v1.md"));
  await rm(path.join(outDir, "docs/index.md"));
  await copyMountedMarkdownMirrors(outDir, mounts, stateDir);
  expect(existsSync(path.join(outDir, "changelog/v1.md"))).toBe(false);
  expect(existsSync(path.join(outDir, "changelog"))).toBe(false);
  expect(await readFile(path.join(outDir, "index.md"), "utf8")).toBe(
    "Host replacement"
  );
});

it("removes obsolete mount output when the mount moves or is removed", async () => {
  const { outDir, stateDir } = await fixture();
  await copyMountedMarkdownMirrors(
    outDir,
    [{ pathPrefix: "changelog", urlPrefix: "/releases" }],
    stateDir
  );
  await copyMountedMarkdownMirrors(
    outDir,
    [{ pathPrefix: "changelog", urlPrefix: "/updates" }],
    stateDir
  );
  expect(existsSync(path.join(outDir, "releases/v1.md"))).toBe(false);
  expect(await readFile(path.join(outDir, "updates/v1.md"), "utf8")).toBe(
    "Release one"
  );
  await copyMountedMarkdownMirrors(outDir, [], stateDir);
  expect(existsSync(path.join(outDir, "updates/v1.md"))).toBe(false);
  expect(
    await readFile(path.join(outDir, "docs/changelog/v1.md"), "utf8")
  ).toBe("Release one");
});

it("does not recursively copy a mirror nested inside its source", async () => {
  const { outDir, stateDir } = await fixture();
  const mounts = [
    { pathPrefix: "changelog", urlPrefix: "/docs/changelog/public" },
  ];
  await copyMountedMarkdownMirrors(outDir, mounts, stateDir);
  await copyMountedMarkdownMirrors(outDir, mounts, stateDir);
  expect(
    await readFile(path.join(outDir, "docs/changelog/public/v1.md"), "utf8")
  ).toBe("Release one");
  expect(existsSync(path.join(outDir, "docs/changelog/public/public"))).toBe(
    false
  );
  await rm(path.join(outDir, "docs/changelog/v1.md"));
  await copyMountedMarkdownMirrors(outDir, mounts, stateDir);
  expect(existsSync(path.join(outDir, "docs/changelog/public/v1.md"))).toBe(
    false
  );
});

it("rejects a root mirror that would overwrite primary docs", async () => {
  const { outDir, stateDir } = await fixture();
  await mkdir(path.join(outDir, "docs/docs"));
  await writeFile(path.join(outDir, "docs/docs/index.md"), "Nested home");
  await expect(
    copyMountedMarkdownMirrors(
      outDir,
      [{ pathPrefix: "", urlPrefix: "/" }],
      stateDir
    )
  ).rejects.toThrow("would overwrite primary docs");
  expect(await readFile(path.join(outDir, "docs/index.md"), "utf8")).toBe(
    "Home"
  );
});
