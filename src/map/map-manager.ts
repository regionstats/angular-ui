import { AsyncSubject, Observable } from "rxjs";
import { ViewBox } from '../models/view-box';

export class MapManager {
    private svgElement: SVGSVGElement;
    private mapGroup: SVGGElement;
    private colorKeyGroup: SVGGElement;
    private defs: SVGDefsElement
    private regions: { [name: string]: SVGElement } = {};
    private viewBox: ViewBox;
    private gradient: SVGLinearGradientElement;

    public getSVG(): SVGSVGElement {
        return this.svgElement;
    }
    public loadSVG(url: string): Observable<SVGSVGElement> {
        let subject = new AsyncSubject<SVGSVGElement>();
        let objectElement = document.createElement("object");
        objectElement.addEventListener("load", () => {
            var unsafeSVG: SVGSVGElement = objectElement.contentDocument && objectElement.contentDocument.querySelector("svg");
            if (unsafeSVG) {
                this.viewBox = new ViewBox(unsafeSVG);
                this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                this.defs.appendChild(this.getShadowFilter());
                this.svgElement.appendChild(this.defs);
                this.mapGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                this.copySVGChildren(unsafeSVG, this.mapGroup);
                this.mapGroup.setAttribute("filter", "url(#shadow)");
                this.svgElement.appendChild(this.mapGroup);
                this.svgElement.setAttribute("width", "100%");
                this.svgElement.setAttribute("height", "100%");
                
                this.gradient = this.getGradient();
                this.defs.appendChild(this.gradient);
                this.colorKeyGroup = this.getColorKeyGroup(this.viewBox)
                this.colorKeyGroup.setAttribute("fill", "url(#gradient)")
                this.colorKeyGroup.setAttribute("filter", "url(#shadow)");
                this.svgElement.appendChild(this.colorKeyGroup);

                this.svgElement.setAttribute("viewBox", this.viewBox.toString());
                subject.next(this.svgElement);
                subject.complete();
                objectElement.remove();
            }
        })
        objectElement.setAttribute("data", url);
        objectElement.style.position = "fixed";//display none causes the data to not load
        objectElement.style.bottom = "100%";
        document.body.appendChild(objectElement);
        return subject.asObservable();
    }

    public setColors(obj) {
        for(var key in obj) {
            if (this.regions[key]) {
                this.regions[key].setAttribute("fill", obj[key]);
            } else {
                console.log("not found:", key)
            }
        }
    }

    private svgLeafs = ["path", "circle", "rect", "line"];
    private copySVGChildren(unsafe: SVGElement, safe: SVGElement) {
        for (var i = 0; i < unsafe.children.length; i++) {
            let unsafeChild = unsafe.children[i];
            if (unsafeChild.tagName == "g") {
                let g = document.createElementNS("http://www.w3.org/2000/svg", "g")
                this.copySVGChildren(<SVGElement>unsafeChild, g);
                safe.appendChild(g);
                this.copySVGAttributes(<SVGElement>unsafeChild, g);
                continue;
            }
            if (this.svgLeafs.indexOf(unsafeChild.tagName) >= 0) {
                let el = document.createElementNS("http://www.w3.org/2000/svg", unsafeChild.tagName);
                this.copySVGAttributes(<SVGElement>unsafeChild, el);
                safe.appendChild(el);
            } else {
                console.log("unsupported tag", unsafeChild.tagName, unsafeChild.children.length)
            }
        }
    }


   //europe.svg ["d", "id", "style", "undefined", "item", "getNamedItem", "getNamedItemNS", "setNamedItem", "setNamedItemNS", "removeNamedItem", "removeNamedItemNS", "sodipodi:nodetypes", "inkscape:connector-curvature", "transform", "y", "x", "height", "width", "clip-path"]
    //US.svg ["name", "fill", "d", "undefined", "item", "getNamedItem", "getNamedItemNS", "setNamedItem", "setNamedItemNS", "removeNamedItem", "removeNamedItemNS", "id", "stroke", "stroke-width", "cx", "cy", "r", "opacity"]
    private svgAttributes = ["d", "style", "fill", "item", "transform", "stroke", "stroke-width", "y", "x", "cx", "cy", "r", "height", "width"]
    private copySVGAttributes(unsafe: SVGElement, safe: SVGElement) {
        for (var key in unsafe.attributes) {
            let attr = unsafe.attributes[key];
            if (attr.name && attr.value) {
                if (this.svgAttributes.indexOf(attr.name) >= 0) {
                    safe.setAttribute(attr.name, attr.value);
                } else if (attr.name == "name") {
                    this.regions[attr.value] = safe;
                }
            }
        }
    }

    private getShadowFilter(): SVGFilterElement {
        let offset = Math.sqrt(this.viewBox.width * this.viewBox.width + this.viewBox.height * this.viewBox.height) / 500;

        let filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "shadow");
        filter.setAttribute("x", "0");
        filter.setAttribute("y", "0");

        let feOffset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
        feOffset.setAttribute("result", "offOut");
        feOffset.setAttribute("in", "SourceAlpha");
        feOffset.setAttribute("dx", offset.toString());
        feOffset.setAttribute("dy", offset.toString());
        let feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        feGaussianBlur.setAttribute("result", "blurOut");
        feGaussianBlur.setAttribute("in", "offOut");
        feGaussianBlur.setAttribute("stdDeviation", "2");
        let feBlend = document.createElementNS("http://www.w3.org/2000/svg", "feBlend");
        feBlend.setAttribute("in", "SourceGraphic");
        feBlend.setAttribute("in2", "blurOut");
        feBlend.setAttribute("mode", "normal");
        filter.appendChild(feOffset);
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feBlend);
        return filter;
    }

    private getColorKeyGroup(viewBox: ViewBox): SVGGElement {
        let paddingRatio = 0.05;
        let widthRatio = 0.07;
        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", (this.viewBox.height * widthRatio).toString());
        rect.setAttribute("height", (this.viewBox.height * (1 - 2 * paddingRatio)).toString());
        rect.setAttribute("x", (this.viewBox.width + this.viewBox.height * paddingRatio).toString());
        rect.setAttribute("y", (this.viewBox.height * paddingRatio).toString());
        //rect.setAttribute("fill", "red");
        this.viewBox.right = this.viewBox.right + (this.viewBox.height * widthRatio) + (this.viewBox.height * paddingRatio * 2);
        group.appendChild(rect);
        return group;
    }

    private getGradient(): SVGLinearGradientElement {
        let linearGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        linearGradient.setAttribute("id", "gradient");
        linearGradient.setAttribute("x1", "0%");
        linearGradient.setAttribute("y1", "0%");
        linearGradient.setAttribute("x2", "0%");
        linearGradient.setAttribute("y2", "100%");
        let stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("style", "stop-color:#ffffff;stop-opacity:1");
        let stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("style", "stop-color:#00ffff;stop-opacity:1");
        linearGradient.appendChild(stop1);
        linearGradient.appendChild(stop2);
        return linearGradient;
    }
}