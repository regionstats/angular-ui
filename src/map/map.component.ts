import { Component, Input, SimpleChange, SimpleChanges } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { MapManager } from './map-manager';
import * as Pako from 'pako';

import { HttpClient } from '@angular/common/http'
import { DataService } from '../services/data.service';
import { Stat } from '../models/stat';
import { Color } from '../models/color';
import { AsyncSubject } from 'rxjs';
import { ViewBox } from '../models/view-box';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'map-component',
    templateUrl: './map.component.html'
})
export class MapComponent {
    @ViewChild('svgContainer') svgContainer: ElementRef;

    private stat: Stat;
    public heightStr: string = "80vh";
    private svg: SVGElement;
    private svgRegions: { [name: string]: SVGElement } = {};
    private mapManager: MapManager

    public currentView: string = "map";

    @Input() minColor: Color;
    @Input() midColor: Color;
    @Input() maxColor: Color;

    constructor(private dateService: DataService) {
        this.mapManager = new MapManager();
        this.minColor = new Color(224, 236, 255);
        this.midColor = new Color(0, 99, 255);
        this.maxColor = new Color(0, 16, 35);
    }

    ngOnInit() {
        this.load().subscribe(() => {
            // let range = stat.max - calcResults.min;
            // for(var key in this.stat.data){
            //     zScores[key.toLowerCase()] = (this.stat.data[key].value - calcResults.mean) / calcResults.sd;
            //     let ratio = (this.stat.data[key].value - 0) / range
            //     colors[this.stat.data[key].region.toLowerCase()] = this.getColor(ratio);
            // }
            // this.mapManager.setColors(colors);

            this.dateService.getStats().combineLatest(this.dateService.getSelectedIndexes()).subscribe(arr => {
                let stats = arr[0];
                let indexes = arr[1];
                this.stat = stats[indexes[0]];
                if (this.stat) {
                    let calc = this.stat.calc;
                    let range = calc.max.value - calc.min.value;
                    let zScores = {}
                    let colors = {}
                    for (var key in this.stat.data) {
                        zScores[key.toLowerCase()] = (this.stat.data[key].value - calc.mean) / calc.sd;
                        let ratio = (this.stat.data[key].value - calc.min.value) / range
                        colors[this.stat.data[key].region.toLowerCase()] = this.getColor(ratio);
                    }
                    this.mapManager.setColors(colors);
                }
            })

        });


        this.dateService.getStats().subscribe(stats => {
            this.stat = stats[0];
            if (this.stat) {
                this.load();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log("changes", changes, this.stat);
    }

    private load() {
        var url = "assets/US.svg";
        return this.mapManager.loadSVG(url).map((svg) => {
            this.svgContainer.nativeElement.appendChild(svg);
            this.setHeight(this.mapManager.getViewBoxRatio());
        });
    }

    // height/width
    private setHeight(ratio: number) {
        let width = document.getElementById("scroll-container").clientWidth
        let height = document.documentElement.clientHeight;
        let svgHeight = width * ratio;
        if (svgHeight < height * .8) {
            this.heightStr = svgHeight + "px";
        } else {
            this.heightStr = "80vh";
        }
    }

    private getColor(ratio) {
        let val: number;
        let newColor: any = {};
        if (ratio >= 0.5) {
            ratio = (ratio * 2) - 1; //ratio now 0 through 1
            newColor.r = (this.midColor.r * (1 - ratio)) + (this.maxColor.r * ratio);
            newColor.g = (this.midColor.g * (1 - ratio)) + (this.maxColor.g * ratio);
            newColor.b = (this.midColor.b * (1 - ratio)) + (this.maxColor.b * ratio);
        } else {
            ratio = ratio * 2; //ratio now 0 through 1
            newColor.r = (this.minColor.r * (1 - ratio)) + (this.midColor.r * ratio);
            newColor.g = (this.minColor.g * (1 - ratio)) + (this.midColor.g * ratio);
            newColor.b = (this.minColor.b * (1 - ratio)) + (this.midColor.b * ratio);
        }

        return "#" + (Math.floor(newColor.r / 16)).toString(16) + Math.floor(newColor.r % 16).toString(16)
            + (Math.floor(newColor.g / 16)).toString(16) + Math.floor(newColor.g % 16).toString(16)
            + (Math.floor(newColor.b / 16)).toString(16) + Math.floor(newColor.b % 16).toString(16);
    }




    //based on https://github.com/wgoto/optimal-std-dev
    calcStdDev(arr) {
        var I = arr.reduce(function (I, x, k) {
            k = k + 1;
            return {
                Sg: I.Sg + x,
                Mk: k === 1 ? x : I.Mk + ((x - I.Mk) / k),
                Qk: k === 1 ? 0 : I.Qk + ((k - 1) * Math.pow(x - I.Mk, 2) / k),
                min: x < I.min ? x : I.min,
                max: x > I.max ? x : I.max,
            }
        }, { Sg: 0, Mk: 0, Qk: 0, min: 1 / 0, max: -1 / 0 });

        var t = I.Sg;
        var n = arr.length;
        var m = t / n;
        var variance = I.Qk / n;
        var sd = Math.sqrt(variance);

        return {
            sum: I.Sg,
            mean: I.Sg / n,
            variance: variance,
            sd: sd,
            min: I.min,
            max: I.max
        };
    }
}
