import { Data } from "./data";

export class Calculation {
    sum: number;
    mean: number;
    variance: number;
    sd: number;
    min: Data;
    max: Data;

     //based on https://github.com/wgoto/optimal-std-dev
    constructor(data: Data[]){
        var obj = data.reduce(function (obj, d: Data, i) {
            i = i + 1;
            return {
                sum: obj.sum + d.v,
                Mk: i === 1 ? d.v : obj.Mk + ((d.v - obj.Mk) / i),
                Qk: i === 1 ? 0 : obj.Qk + ((i - 1) * Math.pow(d.v - obj.Mk, 2) / i),
                min: d.v < obj.min.v ? d : obj.min,
                max: d.v > obj.max.v ? d : obj.max,
            }
        }, { sum: 0, Mk: 0, Qk: 0, min: <Data>{ v: 1 / 0 }, max: <Data>{ v: -1 / 0 } });

        this.sum = obj.sum
        this.mean = obj.sum / data.length
        this.variance = obj.Qk / data.length
        this.sd = Math.sqrt(this.variance);
        this.min = obj.min;
        this.max = obj.max;
    }
}