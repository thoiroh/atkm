// src/app/core/services/config.service.ts // Configuration loading service with profile support

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigProfile, ILandingConfig, LandingConfigFile } from '@core/models/config.models';
import { firstValueFrom, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private readonly http = inject(HttpClient);
  private readonly configPath = 'assets/config/landing-data.json';

  /**
   * Load landing configuration for a specific profile
   * @param profile - Configuration profile to load (default, atkcash, etc.)
   * @returns Observable of the landing configuration
   */
  loadLandingConfig(profile: ConfigProfile = 'default'): Observable<ILandingConfig> {
    return this.http.get<LandingConfigFile>(this.configPath).pipe(
      map(file => file[profile])
    );
  }

  /**
   * Load landing configuration as a Promise (one-shot)
   * Useful for store initialization
   * @param profile - Configuration profile to load
   * @returns Promise resolving to the landing configuration
   */
  async loadLandingConfigOnce(profile: ConfigProfile = 'default'): Promise<ILandingConfig> {
    return await firstValueFrom(this.loadLandingConfig(profile));
  }

  /**
   * Load all available profiles from the configuration file
   * @returns Observable of the complete configuration file
   */
  loadAllProfiles(): Observable<LandingConfigFile> {
    return this.http.get<LandingConfigFile>(this.configPath);
  }
}
