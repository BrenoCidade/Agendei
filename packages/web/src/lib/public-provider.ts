export function getPublicProviderSlug(search = window.location.search) {
  return new URLSearchParams(search).get("slug")?.trim() ?? "";
}

export function getPublicProviderPath(pathname = window.location.pathname) {
  const slug = pathname.replace(/^\/+|\/+$/g, "").trim();
  return slug;
}
