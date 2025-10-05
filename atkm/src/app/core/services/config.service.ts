import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { IconSpec } from '@shared/models/icon.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})

export class ConfigService {

  private configSubject = new BehaviorSubject<ILandingConfig | null>(null);
  private http = inject(HttpClient);

  public config$ = this.configSubject.asObservable();

  loadLandingConfig(key: keyof LandingConfigFile = 'default'): Observable<ILandingConfig> {
    return this.http.get<LandingConfigFile>('assets/config/landing-data.json').pipe(
      map(file => file[key]),
      tap(config => this.configSubject.next(config))
    );
  }

  loadLandingConfig01(): Observable<ILandingConfig> {
    return this.http.get<LandingConfigFile>('assets/config/landing-data.json').pipe(
      map(file => file.default),
      tap(config => this.configSubject.next(config))
    );
  }

  loadLandingConfig02(): Observable<ILandingConfig> {
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
