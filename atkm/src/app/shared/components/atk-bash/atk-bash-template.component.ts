// binance-debug-enhanced.component.ts
import { Component } from '@angular/core';
import { AtkBashComponent } from '@shared/components/atk-bash';

@Component({
  selector: 'atk-bash-debug-template',
  standalone: true,
  imports: [AtkBashComponent],
  template: `
    <div class="debug-wrapper">
      <atk-bash configId="binance-debug-v2" [autoLoad]="true" />
    </div>
  `
})
export class AtkBashDebugTemplateComponent { }
