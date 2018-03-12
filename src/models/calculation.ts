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
                sum: obj.sum + d.value,
                Mk: i === 1 ? d.value : obj.Mk + ((d.value - obj.Mk) / i),
                Qk: i === 1 ? 0 : obj.Qk + ((i - 1) * Math.pow(d.value - obj.Mk, 2) / i),
                min: d.value < obj.min.value ? d : obj.min,
                max: d.value > obj.max.value ? d : obj.max,
            }
        }, { sum: 0, Mk: 0, Qk: 0, min: <Data>{ value: 1 / 0 }, max: <Data>{ value: -1 / 0 } });

        this.sum = obj.sum
        this.mean = obj.sum / data.length
        this.variance = obj.Qk / data.length
        this.sd = Math.sqrt(this.variance);
        this.min = obj.min;
        this.max = obj.max;
    }
}