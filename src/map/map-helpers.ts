import { AsyncSubject, Observable } from "rxjs";
import { ViewBox } from '../models/view-box';

export class MapHelpers {
    private svgElement: SVGSVGElement;
    private mapGroup: SVGGElement;
    private colorKeyGroup: SVGGElement;
    private defs: SVGDefsElement
    private regions: { [name: string]: boolean } = {};
    private viewBox: ViewBox;
    private gradient: SVGLinearGradientElement;


    public static loadUnsafeSVG(url: string): Observable<SVGSVGElement> {
        let subject = new AsyncSubject<SVGSVGElement>();
        let objectElement = document.createElement("object");
        objectElement.addEventListener("load", () => {
            let unsafeSVG = objectElement.contentDocument && objectElement.contentDocument.querySelector("svg");
            subject.next(unsafeSVG);
            subject.complete();
            objectElement.remove();
        })
        objectElement.setAttribute("data", url);
        objectElement.style.position = "fixed";//display none causes the data to not load
        objectElement.style.bottom = "100%";
        document.body.appendChild(objectElement);
        return subject.asObservable();
    }

    private getColorKeyGroup(viewBox: ViewBox): SVGGElement {
        let paddingRatio = 0.05;
        let widthRatio = 0.07;
        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", (this.viewBox.height() * widthRatio).toString());
        rect.setAttribute("height", (this.viewBox.height() * (1 - 2 * paddingRatio)).toString());
        rect.setAttribute("x", (this.viewBox.width() + this.viewBox.height() * paddingRatio).toString());
        rect.setAttribute("y", (this.viewBox.height() * paddingRatio).toString());
        //rect.setAttribute("fill", "red");
        this.viewBox.right = this.viewBox.right + (this.viewBox.height() * widthRatio) + (this.viewBox.height() * paddingRatio * 2);
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
        stop1.setAttribute("style", "stop-color:#e0ecff;stop-opacity:1");
        let stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "50%");
        stop2.setAttribute("style", "stop-color:#0063ff;stop-opacity:1");
        let stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop3.setAttribute("offset", "100%");
        stop3.setAttribute("style", "stop-color:#000608;stop-opacity:1");
        linearGradient.appendChild(stop1);
        linearGradient.appendChild(stop2);
        linearGradient.appendChild(stop3);
        return linearGradient;
    }
}