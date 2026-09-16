import { describe, expect, it } from "vitest";
import {
  matchesUrlPrefix,
  normalizeDocsUrl,
  stripDocsExtension,
  stripTrailingSlashes,
  toAbsoluteUrl,
  toDocsUrlPath,
  toMarkdownUrlPath,
  toMountedMarkdownUrlPath,
} from "./docs-url";

describe("docs URL helpers", () => {
  it("derives canonical docs routes from markdown paths", () => {
    expect(toDocsUrlPath("quickstart.mdx")).toBe("/docs/quickstart");
    expect(toDocsUrlPath("guides\\install.md")).toBe("/docs/guides/install");
    expect(toDocsUrlPath("index.md")).toBe("/docs");
    expect(toDocsUrlPath("guides/index.mdx")).toBe("/docs/guides");
  });

  it("derives mounted docs routes from markdown paths", () => {
    const mounts = [
      { pathPrefix: "", urlPrefix: "/docs" },
      { pathPrefix: "changelog", urlPrefix: "/changelog" },
    ];

    expect(toDocsUrlPath("quickstart.mdx", mounts)).toBe("/docs/quickstart");
    expect(toDocsUrlPath("changelog/v1.mdx", mounts)).toBe("/changelog/v1");
    expect(toDocsUrlPath("changelog/index.mdx", mounts)).toBe("/changelog");
    expect(toMountedMarkdownUrlPath("changelog/index.mdx", mounts)).toBe(
      "/changelog/index.md"
    );
  });

  it("normalizes URL and markdown variants", () => {
    expect(normalizeDocsUrl("/docs/quickstart/?q=install#top")).toBe(
      "/docs/quickstart"
    );
    expect(toMarkdownUrlPath("/docs")).toBe("/docs/index.md");
    expect(toMarkdownUrlPath("/docs/quickstart")).toBe("/docs/quickstart.md");
    expect(stripDocsExtension("guides/quickstart.mdx")).toBe(
      "guides/quickstart"
    );
  });

  it("joins absolute URLs without duplicate trailing slashes", () => {
    expect(stripTrailingSlashes("https://leadtype.dev///")).toBe(
      "https://leadtype.dev"
    );
    expect(toAbsoluteUrl("/docs/quickstart", "https://leadtype.dev/")).toBe(
      "https://leadtype.dev/docs/quickstart"
    );
    expect(toAbsoluteUrl("https://example.com/x", "https://leadtype.dev")).toBe(
      "https://example.com/x"
    );
  });

  it("matches URL prefixes including root mounts", () => {
    expect(matchesUrlPrefix("/quickstart", "/")).toBe(true);
    expect(matchesUrlPrefix("/docs/quickstart", "/")).toBe(true);
    expect(matchesUrlPrefix("/", "/")).toBe(true);
    expect(matchesUrlPrefix("//bad", "/")).toBe(false);
    expect(matchesUrlPrefix("quickstart", "/")).toBe(false);

    expect(matchesUrlPrefix("/docs", "/docs")).toBe(true);
    expect(matchesUrlPrefix("/docs/quickstart", "/docs")).toBe(true);
    expect(matchesUrlPrefix("/doc", "/docs")).toBe(false);
    expect(matchesUrlPrefix("/docs-other", "/docs")).toBe(false);
  });
});
