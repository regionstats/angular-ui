import { Component, Input } from '@angular/core';
import { Color } from '../models/color';

@Component({
    selector: 'color-key',
    templateUrl: './color-key.component.html'
})
export class ColorKeyComponent {
    @Input() minColor: Color;
    @Input() midColor: Color;
    @Input() maxColor: Color;
    background: string;
    constructor() {
        this.minColor = new Color(255, 255, 255);
        this.midColor = new Color(0, 99, 255);
        this.maxColor = new Color(0, 16, 35);
    }

    ngOnInit() {
        this.background = `linear-gradient(${this.minColor},${this.midColor},${this.maxColor})`;

        let maxYColor = new Color(117, 170, 255);
        let midYColor = new Color(21, 0, 103);
        let midColor = new Color(36, 2, 74);
        let midXColor = new Color(140, 0, 30);
        let maxXColor =  new Color(255, 122, 122);

        this.background = `linear-gradient(135deg, ${maxYColor},${midColor},${maxXColor})`;
        //this.background = `linear-gradient(135deg, ${maxYColor},${midYColor},${midColor},${midXColor},${maxXColor})`;
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
