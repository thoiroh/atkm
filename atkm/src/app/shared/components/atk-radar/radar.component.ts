import { AsyncPipe, CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../../../services/app.service';
import { CssService } from '../../../services/css.service';
import { ToolsService } from '../../../services/tools.service';
import { TextPipe } from '../../../directives/transform.pipe';

@Component({
  standalone: true,
  imports: [AsyncPipe, CommonModule, TextPipe],
  providers: [],
  selector: 'app-radar',
  templateUrl: './radar.component.html',
  styleUrl: './radar.component.css'
})
export class RadarComponent implements OnInit, AfterViewInit {
  public params!: any;
  public radarRadius_00: number = 70;
  public radarRadius_01: number = 60;
  public radarRadius_02: number = 50;
  private changeDetect = inject(ChangeDetectorRef);

  @Input() dynamicQueryParams!: any;
  @Input() dynamicComponentParams!: string | any;
  @ViewChild('radar_wrap', { read: ElementRef }) radar_wrap: ElementRef;

  constructor(
    private appService: AppService,
    private cssService: CssService,
    private toolsService: ToolsService,
  ) { }

  ngOnInit(): void {
    this.params = this.appService.setDynamicParams({ dynamicComponentParams: this.dynamicComponentParams, dynamicQueryParams: this.dynamicQueryParams }).params;
    let ratio = 1;
    if (this.params && this.params.ratio && Number(this.params.ratio) !== 0) {
      ratio = (Number(this.params.ratio) / 100 + 1)
      setTimeout(() => {
        this.radarRadius_00 = this.radarRadius_00 * ratio;
        this.radarRadius_01 = this.radarRadius_01 * ratio;
        this.radarRadius_02 = this.radarRadius_02 * ratio;
        this.changeDetect.markForCheck();
      }, 100);
    }
    { // off dbug | RadarComponent | (local)                                        |
      // console.group(`%c\u{26A0}%c RadarComponent / ngOnInit(${AppService.pageId}):`, `color:#fd2727;font-weight:bold;font-size:12px`, `color:#FFFFFF;font-weight:bold;font-size:12px;line-height:1.2;`, AppService.appElements);
      // console.log(`%c>>%c dynamicParams:`, `color: #FFFFFF;font-weight:bold;font-size:12px`, `color:#16c60c;font-weight:bold;font-size:12px;`, dynamicParams);
      // console.log(`%c>>%c params:`, `color: #FFFFFF;font-weight:bold;font-size:12px`, `color:#16c60c;font-weight:bold;font-size:12px;`, this.params);
      // console.groupEnd();
    }
  }

  ngAfterViewInit(): void {
    if (this.params.wrapclass) this.cssService.switchElementRefClass({ target: this.radar_wrap, addedClass: this.params.wrapclass });
  }

}
