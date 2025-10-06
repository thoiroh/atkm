import type { IconSpec } from '@shared/models/icon.model';

type RepoAction = false | {
  label: string;
  action: string;
};

export interface IAtkAppConfig {
  name: string;
  version: string;
  buildDate: string;
  commitHash: string;
  environment: string;
  apiBaseUrl: string;
  title: string;
  subtitle: string;
  logo: string;
  favicon?: string;
  master: string;
}

export interface INavbarConfig {
  logo: {
    src?: string;
    svg?: string;
    alt: string;
    link: string;
  };
  breadcrumb: string[];
  centerTitle: string;
  centerSubtitle: string;
  centerBadge?: string;
}

export interface ISidebarNavConfig {
  userContext: {
    avatar: string;
    username: string;
    title: string;
  };
  sections: ISidebarSection[];
}

export interface ISidebarSection {
  title: string;
  icon: IconSpec;
  action?: RepoAction;
  items: ISidebarMenuItem[];
  isExpanded?: boolean;
}

export interface ISidebarMenuItem {
  icon: IconSpec;
  label: string;
  link: string;
  type?: string;
  action?: RepoAction;
  subMenu?: ISidebarMenuItem[];
  isExpanded?: boolean;
}

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

export interface IConfigPanelSection {
  title: string;
  icon: IconSpec;
  items: Array<{
    icon: IconSpec;
    title: string;
    description: string;
    link: string;
  }>;
}

export interface ILandingConfig {
  atkapp: IAtkAppConfig;
  navbar: INavbarConfig;
  sidebar: ISidebarNavConfig;
  feeds: Array<{
    id: string;
    title: string;
    items: IFeedItem[];
  }>;
  configPanel: {
    isCollapsed: boolean;
    sections: IConfigPanelSection[];
  }
}

export interface LandingConfigFile {
  default: ILandingConfig;
  // si tu prévois d'autres variantes : [key: string]: ILandingConfig;
}
