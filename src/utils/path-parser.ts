import { ParsedPath } from "../types.js";

/**
 * Converts an Express-style path string into a Regular Expression.
 * Example: "/users/:id" -> { regex: /^\/users\/([^\/]+)\/?$/, keys: ["id"] }
 * Example: "/files/*"   -> { regex: /^\/files\/(.*)$/, keys: ["*"] }
 * Example: "*"          -> { regex: /^(.*)$/, keys: ["*"] }
 */
export function pathToRegex(pattern: string): ParsedPath {
  const keys: string[] = [];

  // 1. Replace named params ":param" with a capture group "([^/]+)"
  let regexString = pattern.replace(
    /:([a-zA-Z0-9_]+)/g,
    (_match, paramName) => {
      keys.push(paramName);
      return "([^/]+)";
    }
  );

  // 2. Replace wildcard "*" with a greedy capture group "(.*)"
  regexString = regexString.replace(/\*/g, () => {
    keys.push("*");
    return "(.*)";
  });

  // 3. Wrap with anchors; wildcards don't need an optional trailing slash
  const hasWildcard = keys.includes("*");
  const regex = hasWildcard
    ? new RegExp(`^${regexString}$`)
    : new RegExp(`^${regexString}\\/?$`);

  return { regex, keys };
}
