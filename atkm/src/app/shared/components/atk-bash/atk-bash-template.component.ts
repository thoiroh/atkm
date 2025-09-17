// binance-debug-enhanced.component.ts
import { Component } from '@angular/core';
import { AtkBashComponent } from '@shared/components/atk-bash';

@Component({
  selector: 'atk-bash-debug-template',
  standalone: true,
  imports: [AtkBashComponent],
  template: `
      <atk-bash configId="binance-debug-v2" [autoLoad]="true" />
  `
})
export class AtkBashDebugTemplateComponent { }
