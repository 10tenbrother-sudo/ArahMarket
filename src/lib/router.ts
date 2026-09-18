import { useState, useEffect, useCallback } from 'react';
import { NavTabId } from '../components/Sidebar';

export const PUBLIC_ROUTES = ['/', '/login', '/register', '/features', '/pricing'] as const;
export const PRIVATE_ROUTES = [
  '/dashboard',
  '/markets',
  '/news',
  '/calendar',
  '/currency-strength',
  '/intelligence',
  '/watchlist',
  '/settings',
] as const;

export type PublicRoute = typeof PUBLIC_ROUTES[number];
export type PrivateRoute = typeof PRIVATE_ROUTES[number];
export type AppRoute = PublicRoute | PrivateRoute;

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '') return '/';
  const clean = pathname.toLowerCase().split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1);
  }
  return clean;
}

export function isPublicRoute(path: string): boolean {
  const norm = normalizePath(path);
  return PUBLIC_ROUTES.some(r => r === norm);
}

export function isPrivateRoute(path: string): boolean {
  const norm = normalizePath(path);
  return PRIVATE_ROUTES.some(r => r === norm);
}

const ROUTE_CHANGE_EVENT = 'nexus_route_change';

export function navigate(to: string, replace = false): void {
  const target = normalizePath(to);
  if (replace) {
    window.history.replaceState(null, '', target);
  } else {
    window.history.pushState(null, '', target);
  }
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT, { detail: { path: target } }));
}

export function useLocation() {
  const [path, setPath] = useState<string>(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setPath(normalizePath(window.location.pathname));
    };

    const handleCustomRoute = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      setPath(customEvent.detail?.path || normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener(ROUTE_CHANGE_EVENT, handleCustomRoute);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleCustomRoute);
    };
  }, []);

  const changeRoute = useCallback((to: string, replace = false) => {
    navigate(to, replace);
  }, []);

  return {
    path,
    navigate: changeRoute,
  };
}

export function routeToTab(path: string): NavTabId {
  const norm = normalizePath(path);
  switch (norm) {
    case '/markets':
      return 'intraday_map';
    case '/news':
      return 'events';
    case '/calendar':
      return 'today_catalysts';
    case '/currency-strength':
      return 'currency';
    case '/intelligence':
      return 'intelligence';
    case '/watchlist':
      return 'watchlist';
    case '/settings':
      return 'admin';
    case '/dashboard':
    default:
      return 'terminal';
  }
}

export function tabToRoute(tab: NavTabId): string {
  switch (tab) {
    case 'terminal':
      return '/dashboard';
    case 'intraday_map':
    case 'markets':
      return '/markets';
    case 'today_catalysts':
    case 'macro':
      return '/calendar';
    case 'currency':
      return '/currency-strength';
    case 'events':
      return '/news';
    case 'intelligence':
      return '/intelligence';
    case 'watchlist':
      return '/watchlist';
    case 'admin':
      return '/settings';
    default:
      return '/dashboard';
  }
}
