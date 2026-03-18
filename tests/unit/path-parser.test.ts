import { describe, it, expect } from "vitest";
import { pathToRegex } from "../../src/utils/path-parser.js";

describe("pathToRegex", () => {
  it("matches a static path exactly", () => {
    const { regex, keys } = pathToRegex("/hello");
    expect(keys).toEqual([]);
    expect(regex.test("/hello")).toBe(true);
    expect(regex.test("/hello/")).toBe(true);
    expect(regex.test("/world")).toBe(false);
  });

  it("extracts a single named param", () => {
    const { regex, keys } = pathToRegex("/users/:id");
    expect(keys).toEqual(["id"]);
    const match = regex.exec("/users/42");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("42");
  });

  it("extracts multiple named params", () => {
    const { regex, keys } = pathToRegex("/posts/:postId/comments/:commentId");
    expect(keys).toEqual(["postId", "commentId"]);
    const match = regex.exec("/posts/7/comments/99");
    expect(match![1]).toBe("7");
    expect(match![2]).toBe("99");
  });

  it("handles wildcard *", () => {
    const { regex, keys } = pathToRegex("/files/*");
    expect(keys).toEqual(["*"]);
    expect(regex.test("/files/a/b/c")).toBe(true);
    expect(regex.test("/files/")).toBe(true);
  });

  it("handles bare * catch-all", () => {
    const { regex } = pathToRegex("*");
    expect(regex.test("/anything/at/all")).toBe(true);
    expect(regex.test("/")).toBe(true);
  });

  it("does not match across param segment boundary", () => {
    const { regex } = pathToRegex("/users/:id");
    // params should not match slashes
    expect(regex.test("/users/1/extra")).toBe(false);
  });
});
