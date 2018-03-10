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

@Component({
    selector: 'map-component',
    templateUrl: './map.component.html'
})
export class MapComponent {
    @Input() stat: Stat; 

    @ViewChild('svgContainer') svgContainer: ElementRef;
    @ViewChild('colorKey') colorKey: ElementRef;

    public background: string;

    private svg: SVGElement;
    private svgRegions: { [name: string]: SVGElement } = {};
    private mapManager: MapManager

    public currentView: string = "map";

    private input = {
        "stats": [
            {
                "t": "Murders per 100,000",
                "d": [{ "r": "Alabama", "v": 5.7 }, { "r": "Alaska", "v": 5.6 }, { "r": "Arizona", "v": 4.7 }, { "r": "Arkansas", "v": 5.6 }, { "r": "California", "v": 4.4 }, { "r": "Colorado", "v": 2.8 }, { "r": "Connecticut", "v": 2.4 }, { "r": "Delaware", "v": 5.8 }, { "r": "Florida", "v": 5.8 }, { "r": "Georgia", "v": 5.7 }, { "r": "Hawaii", "v": 1.8 }, { "r": "Idaho", "v": 2 }, { "r": "Illinois", "v": 5.3 }, { "r": "Indiana", "v": 5 }, { "r": "Iowa", "v": 1.9 }, { "r": "Kansas", "v": 3.1 }, { "r": "Kentucky", "v": 3.6 }, { "r": "Louisiana", "v": 10.3 }, { "r": "Maine", "v": 1.6 }, { "r": "Maryland", "v": 6.1 }, { "r": "Massachusetts", "v": 2 }, { "r": "Michigan", "v": 5.4 }, { "r": "Minnesota", "v": 1.6 }, { "r": "Mississippi", "v": 8.6 }, { "r": "Missouri", "v": 6.6 }, { "r": "Montana", "v": 3.6 }, { "r": "Nebraska", "v": 2.9 }, { "r": "Nevada", "v": 6 }, { "r": "New Hampshire", "v": 0.9 }, { "r": "New Jersey", "v": 3.9 }, { "r": "New Mexico", "v": 4.8 }, { "r": "New York", "v": 3.1 }, { "r": "North Carolina", "v": 5.1 }, { "r": "North Dakota", "v": 3 }, { "r": "Ohio", "v": 4 }, { "r": "Oklahoma", "v": 4.5 }, { "r": "Oregon", "v": 2 }, { "r": "Pennsylvania", "v": 4.8 }, { "r": "Rhode Island", "v": 2.4 }, { "r": "South Carolina", "v": 6.4 }, { "r": "South Dakota", "v": 2.3 }, { "r": "Tennessee", "v": 5.7 }, { "r": "Texas", "v": 4.4 }, { "r": "Utah", "v": 2.3 }, { "r": "Vermont", "v": 1.6 }, { "r": "Virginia", "v": 4.1 }, { "r": "Washington", "v": 2.5 }, { "r": "West Virginia", "v": 4 }, { "r": "Wisconsin", "v": 2.9 }, { "r": "Wyoming", "v": 2.7 }, { "r": "district of columbia", "v": 15.9 }],
                "rn": "United States",
                "rt": "State",
                "y": 2014,
                "s": {
                    "t": "FBI Crime Report",
                    "y": 2014
                }
            },
            {
                "t": "V2 Murders per 100,000",
                "d": [{ "r": "Alabama", "v": 5.7 }, { "r": "Alaska", "v": 5.6 }, { "r": "Arizona", "v": 4.7 }, { "r": "Arkansas", "v": 5.6 }, { "r": "California", "v": 4.4 }, { "r": "Colorado", "v": 2.8 }, { "r": "Connecticut", "v": 2.4 }, { "r": "Delaware", "v": 5.8 }, { "r": "Florida", "v": 5.8 }, { "r": "Georgia", "v": 5.7 }, { "r": "Hawaii", "v": 1.8 }, { "r": "Idaho", "v": 2 }, { "r": "Illinois", "v": 5.3 }, { "r": "Indiana", "v": 5 }, { "r": "Iowa", "v": 1.9 }, { "r": "Kansas", "v": 3.1 }, { "r": "Kentucky", "v": 3.6 }, { "r": "Louisiana", "v": 10.3 }, { "r": "Maine", "v": 1.6 }, { "r": "Maryland", "v": 6.1 }, { "r": "Massachusetts", "v": 2 }, { "r": "Michigan", "v": 5.4 }, { "r": "Minnesota", "v": 1.6 }, { "r": "Mississippi", "v": 8.6 }, { "r": "Missouri", "v": 6.6 }, { "r": "Montana", "v": 3.6 }, { "r": "Nebraska", "v": 2.9 }, { "r": "Nevada", "v": 6 }, { "r": "New Hampshire", "v": 0.9 }, { "r": "New Jersey", "v": 3.9 }, { "r": "New Mexico", "v": 4.8 }, { "r": "New York", "v": 3.1 }, { "r": "North Carolina", "v": 5.1 }, { "r": "North Dakota", "v": 3 }, { "r": "Ohio", "v": 4 }, { "r": "Oklahoma", "v": 4.5 }, { "r": "Oregon", "v": 2 }, { "r": "Pennsylvania", "v": 4.8 }, { "r": "Rhode Island", "v": 2.4 }, { "r": "South Carolina", "v": 6.4 }, { "r": "South Dakota", "v": 2.3 }, { "r": "Tennessee", "v": 5.7 }, { "r": "Texas", "v": 4.4 }, { "r": "Utah", "v": 2.3 }, { "r": "Vermont", "v": 1.6 }, { "r": "Virginia", "v": 4.1 }, { "r": "Washington", "v": 2.5 }, { "r": "West Virginia", "v": 4 }, { "r": "Wisconsin", "v": 2.9 }, { "r": "Wyoming", "v": 2.7 }, { "r": "district of columbia", "v": 15.9 }],
                "rn": "United States",
                "rt": "State",
                "y": 2014,
                "s": {
                    "t": "FBI Crime Report",
                    "y": 2014
                }
            }
        ]
    }
    @Input() minColor: Color;
    @Input() midColor: Color;
    @Input() maxColor: Color;

    constructor() {
        this.mapManager = new MapManager();
        this.minColor = new Color(255, 255, 255);
        this.midColor = new Color(0, 99, 255);
        this.maxColor = new Color(0, 16, 35);
    }

    ngOnInit() {
        this.background = `linear-gradient(${this.minColor.toString()},${this.midColor.toString()},${this.maxColor.toString()})`;   

        var url = "assets/US.svg";
        this.mapManager.loadSVG(url).subscribe((svg) => {
            this.svgContainer.nativeElement.appendChild(svg);
            let calcResults = this.calcStdDev(this.stat.data.map(z => z.value));
            let zScores = {}
            let colors = {}
            console.log(calcResults)
            let range = calcResults.max - calcResults.min;
            for(var key in this.stat.data){
                zScores[key.toLowerCase()] = (this.stat.data[key].value - calcResults.mean) / calcResults.sd;
                let ratio = (this.stat.data[key].value - 0) / range
                colors[this.stat.data[key].region.toLowerCase()] = this.getColor(ratio);
            }
            this.mapManager.setColors(colors);
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log("changes", changes, this.stat);
    }




    getColor(ratio) {
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
