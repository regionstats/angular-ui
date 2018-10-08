export class TableRow{
    constructor(region: string, intermediary?: string) {
        this.region = region;
        this.intermediary = intermediary;
        this.values = {};
    }
    region: string;
    intermediary: string;
    values: {[index: number]: number};
}