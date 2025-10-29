import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolsService } from '@core/services/tools.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
  private tools = inject(ToolsService);

  ngOnInit(): void {
    this.tools.setupRouteChangeLogging();
  }


}
