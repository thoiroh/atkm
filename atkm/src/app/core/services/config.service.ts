import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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

type RepoAction = false | {
  label: string;
  action: string;
};

export interface ISidebarNavConfig {
  userContext: {
    avatar: string;
    username: string;
  };
  sections: ISidebarSection[];
}

export interface ISidebarSection {
  title: string;
  action?: RepoAction;
  items: ISidebarMenuItem[];
  isExpanded?: boolean;
}

export interface ISidebarMenuItem {
  icon: string;
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
  icon?: string;
  items: Array<{
    icon: string;
    title: string;
    description: string;
    link: string;
  }>;
}

export interface ILandingConfig {
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

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private configSubject = new BehaviorSubject<ILandingConfig | null>(null);
  public config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient) { }

  loadLandingConfig(): Observable<ILandingConfig> {
    return this.http.get<ILandingConfig>('assets/config/landing-data.json')
      .pipe(
        tap(config => this.configSubject.next(config))
      );
  }

  getConfig(): ILandingConfig | null {
    return this.configSubject.getValue();
  }

  updateConfig(config: Partial<ILandingConfig>): void {
    const currentConfig = this.configSubject.getValue();
    if (currentConfig) {
      this.configSubject.next({ ...currentConfig, ...config });
    }
  }
}
