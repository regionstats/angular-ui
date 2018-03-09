export class TableRow{
    constructor(region: string) {
        this.region = region;
        this.values = [];
    }
    region: string;
    values: number[];
}