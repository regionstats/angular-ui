export class Color {
    r: number;
    g: number;
    b: number;
    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    toString(): string {
        return "#" + (Math.floor(this.r / 16)).toString(16) + Math.floor(this.r % 16).toString(16)
            + (Math.floor(this.g / 16)).toString(16) + Math.floor(this.g % 16).toString(16)
            + (Math.floor(this.b / 16)).toString(16) + Math.floor(this.b % 16).toString(16);
    }
}