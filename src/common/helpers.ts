import { Data } from "@regionstats/models";

export function getRegionName(data: Data): string {
    if (data.i) {
        return data.r.toLowerCase() + ":" + data.i.toLowerCase();
    }
    return data.r.toLowerCase()
}

export function metricFormat(num: number): string {
    let letters = ["", "k", "M", "G", "T", "P"];
    let i = 0;
    while (num >= 1000) {
        num /= 1000;
        i++;
    }
    return parseFloat(num.toPrecision(3)) + letters[i];
}