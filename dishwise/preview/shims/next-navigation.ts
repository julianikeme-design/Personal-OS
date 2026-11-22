import { useMemo } from "react";
import { useRouteState } from "../router";

export function useRouter() {
  const r = useRouteState();
  return { push: r.push, replace: r.push, back: r.back, refresh: () => {}, prefetch: () => {} };
}
export function usePathname() {
  return useRouteState().path;
}
export function useSearchParams() {
  const { search } = useRouteState();
  return useMemo(() => new URLSearchParams(search), [search]);
}
export function useParams<T extends Record<string, string>>() {
  return useRouteState().params as T;
}
