import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import * as Pako from 'pako';

import { HttpClient } from '@angular/common/http'
import { DataService } from './services/data.service';
import { Stat } from './models/stat';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent {
    @ViewChild('svgContainer') svgContainer: ElementRef;
    @ViewChild('colorKey') colorKey: ElementRef;
    
    private svg: SVGElement;
    private textArea: string;
    private svgRegions: { [name: string]: SVGElement } = {};

    public currentView: string = "map";
    public currentStatIndex: number;
    public stats: Stat[] = [];

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

    //2014 murder rate
    private r = 0;
    private g = 99; //42
    private b = 255; //109
    private maxColor = {
        r: 0,
        g: 16,
        b: 35,
    }
    private midColor = {
        r: 0,
        g: 99,
        b: 255,
    }
    private minColor = {
        r: 255,
        g: 255,
        b: 255,
    }



    constructor(private http: HttpClient, private dataService: DataService) {
    }


    ngOnInit() {
        this.dataService.loadPage();
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


    //DELETE THIS
    parseCSV() {
        let arr = this.textArea.split(/\n|\r\n/);
        let output = [];
        arr.forEach(str => {
            if (str) {
                let a = str.split("\t");
                output.push({
                    r: a[0],
                    v: parseFloat(a[1])
                })
            }
        });
        console.log(JSON.stringify(output))
    }

}
