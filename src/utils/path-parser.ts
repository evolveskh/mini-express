import { ParsedPath } from "../types.js";

/**
 * Converts an Express-style path string into a Regular Expression.
 * Example: "/users/:id" -> { regex: /^\/users\/([^\/]+)\/?$/, keys: ["id"] }
 */
export function pathToRegex(pattern: string): ParsedPath {
  const keys: string[] = [];

  // 1. Replace all ":param" with a regex capture group "([^/]+)"
  // Example: "/users/:id" becomes "/users/([^/]+)"
  const regexString = pattern.replace(
    /:([a-zA-Z0-9_]+)/g,
    (match, paramName) => {
      keys.push(paramName); // Save the name "id"
      return "([^/]+)"; // Replace with regex that captures letters/numbers
    }
  );

  // 2. Wrap the string in ^ and $ (start and end of string)
  // Optional trailing slash at the end \/?
  const regex = new RegExp(`^${regexString}\\/?$`);

  return { regex, keys };
}
