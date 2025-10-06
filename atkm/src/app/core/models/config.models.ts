// src/app/core/models/config.models.ts / Central configuration interfaces for the ATK application

import type { IconSpec } from '@shared/models/icon.model';

/**
 * Application metadata and versioning information
 */
export interface IAtomicAppConfig {
  version: string;
  buildDate: string;
  commitHash: string;
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  title: string;
  subtitle: string;
  logo: string;
  favicon: string;
  master: string;
}

/**
 * Navbar logo configuration
 */
export interface INavbarLogoConfig {
  src?: string;
  svg?: string;
  alt: string;
  link: string;
}

/**
 * Main navbar configuration
 */
export interface INavbarConfig {
  logo: INavbarLogoConfig;
  breadcrumb: string[];
  centerTitle: string;
  centerSubtitle: string;
  centerBadge?: string;
}

/**
 * Repository action type
 * Can be false (no action) or an object with label and action
 */
export type RepoAction = false | {
  label: string;
  action: string;
};

/**
 * Sidebar menu item configuration
 */
export interface ISidebarMenuItem {
  icon: IconSpec;
  label: string;
  link: string;
  type?: string;
  action?: RepoAction;
  subMenu?: ISidebarMenuItem[];
  isExpanded?: boolean;
}

/**
 * Sidebar section configuration
 */
export interface ISidebarSection {
  title: string;
  icon: IconSpec;
  action?: RepoAction;
  items: ISidebarMenuItem[];
  isExpanded?: boolean;
}

/**
 * User context displayed in sidebar
 */
export interface ISidebarUserContext {
  avatar: string;
  username: string;
  title: string;
}

/**
 * Complete sidebar navigation configuration
 */
export interface ISidebarNavConfig {
  userContext: ISidebarUserContext;
  sections: ISidebarSection[];
}

/**
 * Feed item for activity feeds
 */
export interface IFeedItem {
  id: string;
  avatar: string;
  action: string;
  time: string;
  repo: {
    name: string;
    link: string;
    description: string;
  };
  stats: {
    language?: {
      name: string;
      color: string;
    };
    stars?: number;
  };
}

/**
 * Feed section containing multiple feed items
 */
export interface IFeed {
  id: string;
  title: string;
  items: IFeedItem[];
}

/**
 * Configuration panel item
 */
export interface IConfigPanelItem {
  icon: IconSpec;
  title: string;
  description: string;
  link: string;
}

/**
 * Configuration panel section
 */
export interface IConfigPanelSection {
  title: string;
  icon: IconSpec;
  items: IConfigPanelItem[];
}

/**
 * Configuration panel state and sections
 */
export interface IConfigPanel {
  isCollapsed: boolean;
  sections: IConfigPanelSection[];
}

/**
 * Complete landing page configuration
 * This is the main configuration object used throughout the app
 */
export interface ILandingConfig {
  atkapp: IAtomicAppConfig;
  navbar: INavbarConfig;
  sidebar: ISidebarNavConfig;
  feeds: IFeed[];
  configPanel: IConfigPanel;
}

/**
 * Landing configuration file structure
 * Contains multiple profiles (default, atkcash, etc.)
 */
export interface LandingConfigFile {
  default: ILandingConfig;
  atkcash: ILandingConfig;
  [key: string]: ILandingConfig; // Allow additional profiles
}

/**
 * Available configuration profiles
 */
export type ConfigProfile = 'default' | 'atkcash';
