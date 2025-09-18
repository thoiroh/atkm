import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AtkIconComponent } from '../atk-icon/atk-icon.component';

@Component({
  selector: 'atk-home-content',
  standalone: true,
  imports: [CommonModule, AtkIconComponent],
  templateUrl: './home-content.component.html',
  styles: []
})
export class HomeContentComponent implements OnInit {

  public inputHeight = '200px';

  ngOnInit(): void {
    console.log('Home content component initialized');
  }


}
