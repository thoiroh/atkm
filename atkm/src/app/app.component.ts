import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
      <main class="">
        <router-outlet></router-outlet>
      </main>
  `,
  styles: [`
    main {
      min-height: 10vh;
      background-color: #f8f9fa;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }


  `]
})
export class AppComponent {
  title = 'atomeek-datamatrix';
}
