/**
 * Minimal in-memory router for the browser-only preview build.
 * Replaces Next.js routing so the app runs inside a single page.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType } from "react";

export interface RouteState {
  path: string;
  search: string;
  params: Record<string, string>;
  push: (href: string) => void;
  back: () => void;
}

export const RouterContext = createContext<RouteState | null>(null);

export function useRouteState(): RouteState {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("Router missing");
  return ctx;
}

type Route = { pattern: string; Component: ComponentType };

function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function Router({ routes, Shell }: { routes: Route[]; Shell: ComponentType<{ children: React.ReactNode }> }) {
  const [loc, setLoc] = useState<{ path: string; search: string }>({ path: "/", search: "" });
  const [history, setHistory] = useState<{ path: string; search: string }[]>([]);

  const locRef = useRef(loc);
  locRef.current = loc;
  const historyRef = useRef(history);
  historyRef.current = history;

  const push = useCallback((href: string) => {
    const [path, search = ""] = href.split("?");
    setHistory([...historyRef.current.slice(-30), locRef.current]);
    setLoc({ path: path || "/", search: search ? `?${search}` : "" });
  }, []);
  const back = useCallback(() => {
    const h = historyRef.current;
    if (!h.length) return setLoc({ path: "/", search: "" });
    setLoc(h[h.length - 1]);
    setHistory(h.slice(0, -1));
  }, []);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0 });
    } catch {}
  }, [loc.path, loc.search]);

  let found: { Component: ComponentType; params: Record<string, string> } | null = null;
  for (const r of routes) {
    const p = match(r.pattern, loc.path);
    if (p) {
      found = { Component: r.Component, params: p };
      break;
    }
  }
  const state = useMemo<RouteState>(
    () => ({ path: loc.path, search: loc.search, params: found?.params ?? {}, push, back }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loc.path, loc.search, push, back],
  );
  const Page = found?.Component ?? routes[0].Component;
  return (
    <RouterContext.Provider value={state}>
      <Shell>
        <Page key={loc.path + loc.search} />
      </Shell>
    </RouterContext.Provider>
  );
}
