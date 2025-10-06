import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ILandingConfig, LandingConfigFile } from '@core/models/config.models';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class ConfigService {

  private http = inject(HttpClient);

  loadLandingConfig(): Observable<ILandingConfig> {
    return this.http.get<ILandingConfig>('assets/data/landing-data.json');
  }

  // Promesse one-shot pour usage simple dans un store à signals
  async loadLandingConfigOnce(): Promise<ILandingConfig> {
    return await firstValueFrom(this.loadLandingConfig());
  }

  // getConfig(): ILandingConfig | null {
  //   return this.configSubject.getValue();
  // }

  // updateConfig(config: Partial<ILandingConfig>): void {
  //   const currentConfig = this.configSubject.getValue();
  //   if (currentConfig) {
  //     this.configSubject.next({ ...currentConfig, ...config });
  //   }
  // }
}
