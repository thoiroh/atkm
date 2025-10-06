import { computed, inject, Injectable, signal } from '@angular/core';

import { ToolsService } from '@shared/services/tools.service';
import { ConfigService } from '../services/config.service';

import { ILandingConfig, INavbarConfig } from '@core/models/config.models';

@Injectable({ providedIn: 'root' })

export class ConfigStore {

  // =========================================
  // SERVICES -
  // =========================================

  private tools = inject(ToolsService);
  private readonly configService = inject(ConfigService);
  private readonly _config = signal<ILandingConfig | null>(null);

  // =========================================
  // SELECTEURS
  // =========================================

  readonly config = computed(() => this._config());
  readonly navbar = computed<INavbarConfig | null>(() => this._config()?.navbar ?? null);
  readonly configPanelCollapsed = computed<boolean>(() => !!this._config()?.configPanel?.isCollapsed);

  // =========================================
  // CONTROLLERS
  // =========================================

  setConfig(cfg: ILandingConfig) {
    this._config.set(cfg);
    // this.tools.consoleGroup({ // TAG ConfigStore -> ngOnInit()
    //   title: `ConfigStore -> setConfig() : ${cfg.atkapp.master} `, tag: 'check', palette: 'in', collapsed: true,
    //   data: this.config(),
    //   // title: `LandingComponent -> ngOnInit() -> loadLandingConfig(): ${this.config.atkapp.master} `, tag: 'check', palette: 'in', collapsed: true, data: { config: this.config },
    // });
  }

  update(partial: Partial<ILandingConfig>) {
    const current = this._config();
    if (!current) return;
    this._config.set({ ...current, ...partial });
  }

  toggleConfigPanel() {
    const cur = this._config();
    if (!cur) return;
    this._config.set({
      ...cur,
      configPanel: {
        ...cur.configPanel,
        isCollapsed: !cur.configPanel?.isCollapsed,
        sections: cur.configPanel?.sections ?? []
      }
    });

  }

  // =========================================
  // HANDLERS
  // =========================================

  async loadLandingConfig(): Promise<void> {
    const cfg = await this.configService.loadLandingConfigOnce();
    this._config.set(cfg);
    this.tools.consoleGroup({ // TAG ConfigStore -> ngOnInit()
      title: `ConfigStore -> setConfig() :`, tag: 'check', palette: 'in', collapsed: true,
      data: this._config(),
      // title: `LandingComponent -> ngOnInit() -> loadLandingConfig(): ${this.config.atkapp.master} `, tag: 'check', palette: 'in', collapsed: true, data: { config: this.config },
    });
  }
}
