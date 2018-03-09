import { Source } from "./Source";
import { Data } from "./Data";

export class Stat {
    title: string;
    data: Data[];
    regionName: string;
    regionType: string;
    year: number;
    source: Source;
    regionMap: string;
}