import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'atk-market-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './binance-market-data.component.html',
  styleUrls: ['./../binance.component.css']

})
export class MarketDataComponent { }
