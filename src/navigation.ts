/** The site's pages, in the order the navigation and footer list them. */
export const PAGES = [
  { href: "/work", label: "Work" },
  { href: "/journal", label: "Journal" },
  { href: "/about", label: "About" },
] as const;

export const CONTACT_HREF = "/#contact";
export const SOURCE_HREF = "https://github.com/wrych";
export const LICENSE_LINE = "Code MIT · Content CC BY 4.0 · Logo © xigo";

/** The address a visitor sees for `path`: a prerendered page's path may
 * carry `.html` or a trailing slash, which the server's addresses do not. */
export function canonicalPath(path: string): string {
  const bare = path.replace(/\.html$/, "").replace(/\/+$/, "");
  return bare === "" || bare === "/index" ? "/" : bare;
}

/** Whether a link belongs to the page at `path`: the page itself, or a post
 * or project inside it. */
export function isCurrent(href: string, path: string): boolean {
  const page = canonicalPath(path);
  if (href === "/") return page === "/";
  return page === href || page.startsWith(`${href}/`);
}
