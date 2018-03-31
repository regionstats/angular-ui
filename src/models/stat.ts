import { Source } from "./source";
import { Data } from "./data";
import { Calculation } from "./calculation";

export class Stat {
    title: string;
    data: Data[];
    regionName: string;
    regionType: string;
    regionIntermediary: string;
    year: number;
    source: Source;
    regionMap: string;
    calc: Calculation;
}