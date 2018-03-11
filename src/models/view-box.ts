export class ViewBox {
    left: number;
    top: number;
    right: number;
    bottom: number;

    width(): number {
        return this.right - this.left;
    }
    height(): number{
        return this.bottom - this.top;
    }
    constructor(svg: SVGSVGElement) {
        let attribute = svg.getAttribute("viewBox");
        if (attribute) {
            let bounds = attribute.split(" ");
            if (bounds.length == 4 && /^[0-9 ]+$/.test(attribute)) {
                this.left = parseFloat(bounds[0])
                this.top = parseFloat(bounds[1]);
                this.right = parseFloat(bounds[2]);
                this.bottom = parseFloat(bounds[3]);
            } else {
                this.setDefaults();
            }
        }
        else {
            let widthStr = svg.getAttribute("width");
            let heightStr = svg.getAttribute("height");
            if (widthStr && heightStr) {
                this.left = 0;
                this.top = 0;
                this.right = parseFloat(widthStr);
                this.bottom = parseFloat(heightStr);
            } else {
                this.setDefaults();
            }
        }
    }
    
    public setDefaults() {
        this.left = 0;
        this.top = 0;
        this.right = 300;
        this.bottom = 300;
    }

    public toString() {
        return `${this.left} ${this.top} ${this.right} ${this.bottom}`;
    }

}