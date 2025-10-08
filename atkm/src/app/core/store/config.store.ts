// src/app/core/store/config.store.ts // Centralized configuration state management using Angular 20 signals
// Provides reactive access to configuration across the application

import { computed, inject, Injectable, signal } from '@angular/core';
import { ConfigProfile, IAtomeekAppConfig, IConfigPanel, IFeed, ILandingConfig, INavbarConfig, ISidebarNavConfig } from '@core/models/config.models';
import { ConfigService } from '@core/services/config.service';
import { ToolsService } from '@shared/services/tools.service';

/**
 * Default empty configuration to prevent null errors before loading
 */
const DEFAULT_CONFIG: ILandingConfig = {
  atkapp: {
    version: '0.0.0',
    buildDate: new Date().toISOString(),
    commitHash: 'unknown',
    environment: 'development',
    apiBaseUrl: '',
    title: 'Loading...',
    subtitle: '',
    logo: '',
    favicon: '',
    master: ''
  },
  navbar: {
    logo: { alt: '', link: '#' },
    breadcrumb: [],
    centerTitle: '',
    centerSubtitle: '',
    centerBadge: ''
  },
  sidebar: {
    userContext: {
      avatar: '',
      username: '',
      title: ''
    },
    sections: []
  },
  feeds: [],
  configPanel: {
    isCollapsed: true,
    sections: []
  }
};

@Injectable({ providedIn: 'root' })
export class ConfigStore {

  // =========================================
  // DEPENDENCIES
  // =========================================

  private readonly tools = inject(ToolsService);
  private readonly configService = inject(ConfigService);

  // =========================================
  // STATE SIGNALS
  // =========================================

  private readonly _config = signal<ILandingConfig>(DEFAULT_CONFIG);
  private readonly _profile = signal<ConfigProfile>('default');
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // =========================================
  // COMPUTED SELECTORS
  // =========================================

  readonly config = computed(() => this._config());
  readonly profile = computed(() => this._profile());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  // Specific configuration sections
  readonly atkapp = computed<IAtomeekAppConfig>(() => this._config().atkapp);
  readonly navbar = computed<INavbarConfig>(() => this._config().navbar);
  readonly sidebar = computed<ISidebarNavConfig>(() => this._config().sidebar);
  readonly feeds = computed<IFeed[]>(() => this._config().feeds);
  readonly configPanel = computed<IConfigPanel>(() => this._config().configPanel);
  readonly configPanelCollapsed = computed<boolean>(() => this._config().configPanel.isCollapsed);
  readonly configPanelSections = computed(() => this._config().configPanel.sections);

  // =========================================
  // PUBLIC METHODS
  // =========================================

  /**
   * Set the entire configuration
   * @param cfg - New configuration object
   */
  setConfig(cfg: ILandingConfig): void {
    this._config.set(cfg);
  }

  /**
   * Update configuration with partial changes
   * @param partial - Partial configuration to merge
   */
  update(partial: Partial<ILandingConfig>): void {
    const current = this._config();
    this._config.set({ ...current, ...partial });
  }

  /**
   * Toggle the configuration panel collapsed state
   */
  toggleConfigPanel(): void {
    const current = this._config();
    this._config.set({
      ...current,
      configPanel: {
        ...current.configPanel,
        isCollapsed: !current.configPanel.isCollapsed
      }
    });
  }

  /**
   * Set the current configuration profile
   * @param profile - Profile name to activate
   */
  setProfile(profile: ConfigProfile): void {
    this._profile.set(profile);
  }

  // =========================================
  // ASYNC OPERATIONS
  // =========================================

  /**
   * Load landing configuration from the server
   * @param profile - Configuration profile to load (default or atkcash)
   * @returns Promise that resolves when configuration is loaded
   */
  async loadLandingConfig(profile?: ConfigProfile): Promise<void> {
    const targetProfile = profile || this._profile();

    this._loading.set(true);
    this._error.set(null);

    try {
      const cfg = await this.configService.loadLandingConfigOnce(targetProfile);
      this._config.set(cfg);
      this._profile.set(targetProfile);

      this.tools.consoleGroup({ // TAG ConfigStore -> loadLandingConfig() ================ CONSOLE LOG IN PROGRESS
        title: `ConfigStore -> loadLandingConfig()`, tag: 'check', palette: 'in', collapsed: true,
        data: this.config()
      });


    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error loading configuration';
      this._error.set(errorMessage);

      this.tools.consoleGroup({ // TAG ConfigStore -> loadLandingConfig() ================ CONSOLE LOG IN PROGRESS
        title: `ConfigStore -> loadLandingConfig() -> Error loading configuration`, tag: 'check', palette: 'er', collapsed: false,
        data: { profile: targetProfile, error: err }
      });

      console.error('Error loading configuration:', err);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Switch to a different configuration profile
   * @param profile - New profile to load
   * @returns Promise that resolves when profile is loaded
   */
  async switchProfile(profile?: ConfigProfile | ''): Promise<void> {
    if (profile === '' && this._profile() === 'default') {
      profile = 'atkcash' as ConfigProfile;
    } else {
      // Sinon, on repasse sur "default"
      profile = 'default' as ConfigProfile;
    }
    if (profile === this._profile()) {
      return; // Already using this profile
    }
    await this.loadLandingConfig(profile);
  }
}
