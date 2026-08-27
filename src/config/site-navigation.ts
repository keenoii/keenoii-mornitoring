/**
 * Global Site Navigation & Header Configuration
 * Single Source of Truth for all navigation bars, routes, links, and breadcrumbs.
 */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName: 'LayoutDashboard' | 'Building2' | 'Sparkles' | 'Brain' | 'Flame' | 'Settings';
  badge?: string;
  isExternal?: boolean;
}

export interface SiteNavigationConfig {
  appName: string;
  appShortName: string;
  appVersion: string;
  tagline: string;
  navItems: NavItem[];
  viewModes: {
    id: 'portfolio' | 'virtual' | 'command';
    label: string;
    icon: string;
    href: string;
  }[];
  quickLinks: {
    label: string;
    href: string;
    icon: string;
  }[];
}

export const SITE_NAVIGATION_CONFIG: SiteNavigationConfig = {
  appName: 'KEENOII PROJECT SENTINEL',
  appShortName: 'SENTINEL',
  appVersion: 'v1.2',
  tagline: 'Engineering Intelligence & Portfolio Command Center',
  navItems: [
    {
      id: 'portfolio',
      label: 'Portfolio Overview',
      href: '/',
      iconName: 'LayoutDashboard',
    },
    {
      id: 'virtual-office',
      label: 'Virtual Office (2.5D)',
      href: '/office',
      iconName: 'Building2',
      badge: 'Interactive',
    },
  ],
  viewModes: [
    {
      id: 'portfolio',
      label: 'Command Dashboard',
      icon: '📊',
      href: '/',
    },
    {
      id: 'virtual',
      label: 'Virtual 2.5D Office',
      icon: '🏢',
      href: '/office',
    },
  ],
  quickLinks: [
    {
      label: 'GitHub Workspaces',
      href: 'https://github.com',
      icon: 'GitBranch',
    },
  ],
};
