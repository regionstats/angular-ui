import { AsyncSubject, Observable } from "rxjs";
import { ViewBox } from '../models/view-box';

export class ScatterplotManager {
    private svgElement: SVGSVGElement;
    private lineGroup: SVGGElement;
    private dotGroup: SVGGElement;
    private defs: SVGDefsElement
    private regions: { [name: string]: SVGElement } = {};
    private viewBox: ViewBox;
    private gradient: SVGLinearGradientElement;


    public getSVG(): SVGSVGElement {
        this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");

        let mainRect = this.getMainRect();
        this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        this.svgElement.appendChild(this.defs);
        this.dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        mainRect.appendChild(this.dotGroup);

        this.lineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svgElement.appendChild(mainRect);
        this.svgElement.setAttribute("width", "100%");
        this.svgElement.setAttribute("height", "100%");
        this.svgElement.setAttribute("viewBox", "0 0 10000 10000");
        return this.svgElement;
    }

    

    public setColors(obj) {
        for (var key in obj) {
            if (this.regions[key]) {
                this.regions[key].setAttribute("fill", obj[key]);
            } else {
                console.log("not found:", key)
            }
        }
    }

    private getMainRect(): SVGRectElement {
        let stroke = 50;
        let mainRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        mainRect.setAttribute("x", "0");
        mainRect.setAttribute("y", stroke.toString());
        mainRect.setAttribute("width", "10000");
        mainRect.setAttribute("height", (10000 - stroke*2).toString());
        mainRect.setAttribute("stroke", "#aaa");
        mainRect.setAttribute("fill", "none");
        mainRect.setAttribute("stroke-width", stroke.toString());
        return mainRect;
    } 
}