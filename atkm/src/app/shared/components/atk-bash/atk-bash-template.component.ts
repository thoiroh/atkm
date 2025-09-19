// atk-bash-template.component.ts (Updated)
// Template component demonstrating new harmonized bash architecture

import { Component } from '@angular/core';
import { AtkBashComponent } from '@shared/components/atk-bash';
import { SidebarBashConfigComponent } from '@shared/components/sidebar-bash-config/sidebar-bash-config.component';

@Component({
  selector: 'atk-bash-debug-template',
  standalone: true,
  imports: [AtkBashComponent, SidebarBashConfigComponent],
  templateUrl: './atk-bash-template.component.html',
  styleUrls: ['./atk-bash-template.component.css'],
})

export class AtkBashDebugTemplateComponent {

  /**
   * Handle data loaded from terminal
   */
  onDataLoaded(data: any[]): void {
    console.log('✅ Data loaded in template:', data.length, 'items');
  }

  /**
   * Handle error from terminal
   */
  onErrorOccurred(error: string): void {
    console.error('❌ Error in template:', error);
  }

  /**
   * Handle panel toggle from sidebar
   */
  onTogglePanel(): void {
    console.log('🔄 Panel toggle requested from template');
  }

  /**
   * Handle endpoint change from sidebar
   */
  onEndpointChanged(endpointId: string): void {
    console.log('📡 Endpoint changed in template:', endpointId);
  }

  /**
   * Handle parameter change from sidebar
   */
  onParameterChanged(parameters: Record<string, any>): void {
    console.log('📝 Parameters changed in template:', parameters);
  }
}
