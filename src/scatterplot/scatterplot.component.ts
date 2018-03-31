import { Component, Input, SimpleChange, SimpleChanges } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';

import { HttpClient } from '@angular/common/http'
import { DataService } from '../services/data.service';
import { Stat } from '../models/stat';
import { Color } from '../models/color';
import { AsyncSubject } from 'rxjs';
import { ViewBox } from '../models/view-box';
import { Data } from '../models/data';
import { Dot } from './dot';
import { AnimateService, Task, TaskAttribute } from '../services/animate.service';
import { Attribute } from '@angular/compiler';

@Component({
    selector: 'scatterplot-component',
    templateUrl: './scatterplot.component.html'
})
export class ScatterplotComponent {
    @ViewChild('svgContainer') svgContainer: ElementRef;

    public width: number;
    public dotMap: { [region: string]: Dot } = {};

    private statX: Stat;
    private statY: Stat;

    private svgElement: SVGSVGElement;
    private sdMarkersGroup: SVGGElement;
    private axisGroup: SVGGElement;
    private dotGroup: SVGGElement;
    private defs: SVGDefsElement
    private maxZ: number;
    private zViewboxRatio: number;
    private marginRatio: number;

    private slope: number;
    private intercept: number;

    private currentDot: Dot;
    private currentClickDot: Dot;
    private currentHoverDot: Dot;

    constructor(private dateService: DataService, private animateService: AnimateService) {
        this.marginRatio = .95;
        this.maxZ = 4;
        this.zViewboxRatio = 5000 * this.marginRatio / this.maxZ;
    }

    ngOnInit() {
        this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        this.defs.appendChild(this.getBlurFilter());
        this.svgElement.appendChild(this.defs);
        this.sdMarkersGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svgElement.appendChild(this.sdMarkersGroup);
        this.sdMarkersGroup.setAttribute("id", "sd-markers-group");
        this.axisGroup = this.getAxisGroup();
        this.svgElement.appendChild(this.axisGroup);
        this.dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svgElement.appendChild(this.dotGroup);
        let mainRect = this.getMainRect();
        this.svgElement.appendChild(mainRect);
        this.svgElement.setAttribute("width", "100%");
        this.svgElement.setAttribute("height", "100%");
        this.svgElement.setAttribute("overflow", "hidden");
        this.svgElement.setAttribute("viewBox", "0 0 10000 10000");
        this.svgContainer.nativeElement.appendChild(this.svgElement);
        this.dateService.getStats().combineLatest(this.dateService.getSelectedIndexes()).subscribe(arr => {
            let stats = arr[0];
            let indexes = arr[1];
            if (!stats || stats.length < 2) {
                return;
            }
            this.statX = stats[indexes[0]];
            this.statY = stats[indexes[1]];
            this.statsChanged();
        });
        this.setWidth();
        this.svgContainer.nativeElement.addEventListener("click", this.mouseClick.bind(this))
        this.svgContainer.nativeElement.addEventListener("mousemove", this.mouseMove.bind(this))
        this.svgContainer.nativeElement.addEventListener("mouseleave", this.dotHovered.bind(this, null))
    }

    private setWidth() {
        let width = document.getElementById("scroll-container").clientWidth
        let height = document.documentElement.clientHeight;
        if (width < (height * .8)) {
            this.width = Math.round(width - 50);
        } else {
            this.width = Math.round(height * .8 - 50);
        }
    }

    private statsChanged() {
        let oldDotMap = this.dotMap;
        this.dotMap = this.getDotMap();
        //delete unused dots from the old map
        for (let id in oldDotMap) {
            if (!this.dotMap[id]) {
                this.removeElement("rs-" + id);
            }
        }
        let oldZViewboxRatio = this.zViewboxRatio;
        let oldMaxZ = this.maxZ;
        let maxZX = Math.max(...Object.keys(this.dotMap).map(id => Math.abs(this.dotMap[id].x)));
        let maxZY = Math.max(...Object.keys(this.dotMap).map(id => Math.abs(this.dotMap[id].y)));
        this.maxZ = Math.max(maxZX, maxZY);
        this.zViewboxRatio = 5000 * this.marginRatio / this.maxZ;
        let tasks: Task[] = [];

        // ***************************************
        // ***** SD Markers
        // ***************************************
        for (var i = 1; i < Math.max(this.maxZ, oldMaxZ) / this.marginRatio; i++) {
            let sdColor = "#aaa";
            let el = document.getElementById("zx-minus-" + i);
            if (!el) {
                let line = this.getVerticalLine(5000 - (i * oldZViewboxRatio), sdColor, 10);
                line.setAttribute("id", "zx-minus-" + i);
                this.sdMarkersGroup.appendChild(line);
            }
            let task = new Task("zx-minus-" + i);
            task.attributes.push(new TaskAttribute("x1", 5000 - (i * oldZViewboxRatio), 5000 - (i * this.zViewboxRatio)));
            task.attributes.push(new TaskAttribute("x2", 5000 - (i * oldZViewboxRatio), 5000 - (i * this.zViewboxRatio)));
            tasks.push(task);

            el = document.getElementById("zx-plus-" + i);
            if (!el) {
                let line = this.getVerticalLine(5000 + (i * oldZViewboxRatio), sdColor, 10);
                line.setAttribute("id", "zx-plus-" + i);
                this.sdMarkersGroup.appendChild(line);
            }
            task = new Task("zx-plus-" + i);
            task.attributes.push(new TaskAttribute("x1", 5000 + (i * oldZViewboxRatio), 5000 + (i * this.zViewboxRatio)));
            task.attributes.push(new TaskAttribute("x2", 5000 + (i * oldZViewboxRatio), 5000 + (i * this.zViewboxRatio)));
            tasks.push(task);

            el = document.getElementById("zy-plus-" + i);
            if (!el) {
                let line = this.getHorizontalLine(5000 + (i * oldZViewboxRatio), sdColor, 10);
                line.setAttribute("id", "zy-plus-" + i);
                this.sdMarkersGroup.appendChild(line);
            }
            task = new Task("zy-plus-" + i);
            task.attributes.push(new TaskAttribute("y1", 5000 - (i * oldZViewboxRatio), 5000 - (i * this.zViewboxRatio)));
            task.attributes.push(new TaskAttribute("y2", 5000 - (i * oldZViewboxRatio), 5000 - (i * this.zViewboxRatio)));
            tasks.push(task);

            el = document.getElementById("zy-minus-" + i);
            if (!el) {
                let line = this.getHorizontalLine(5000 + (i * oldZViewboxRatio), sdColor, 10);
                line.setAttribute("id", "zy-minus-" + i);
                this.sdMarkersGroup.appendChild(line);
            }
            task = new Task("zy-minus-" + i);
            task.attributes.push(new TaskAttribute("y1", 5000 + (i * oldZViewboxRatio), 5000 + (i * this.zViewboxRatio)));
            task.attributes.push(new TaskAttribute("y2", 5000 + (i * oldZViewboxRatio), 5000 + (i * this.zViewboxRatio)));
            tasks.push(task);
        }
    
        // ***************************************
        // ***** Trend Line
        // ***************************************
        {
            let oldSlope = this.slope;
            let oldIntercept = this.intercept;
            this.updateTrendLine(this.dotMap);
            let oldy1 = oldSlope != null ? 5000 + (oldSlope * 5000) - (oldIntercept * oldZViewboxRatio) : 5000;
            let oldy2 = oldSlope != null ? 5000 - (oldSlope * 5000) - (oldIntercept * oldZViewboxRatio) : 5000;
            let y1 = 5000 + (this.slope * 5000) - (this.intercept * this.zViewboxRatio);
            let y2 = 5000 - (this.slope * 5000) - (this.intercept * this.zViewboxRatio);
            let el = document.getElementById("trend-line");
            if (!el) {
                let line = this.getLine(0, y1, 10000, y2, "#333", 20);
                line.setAttribute("id", "trend-line");
                this.sdMarkersGroup.appendChild(line);
            } 
            let task = new Task("trend-line");
            task.attributes.push(new TaskAttribute("y1", oldy1, y1));
            task.attributes.push(new TaskAttribute("y2", oldy2, y2));
            tasks.push(task);
        }    

        // ***************************************
        // ***** Dots
        // ***************************************
        for (let region in this.dotMap) {
            if (!oldDotMap[region]) {
                this.addCircle(this.dotMap[region], 500 / this.maxZ);
            } else {
                let task = new Task("rs-" + region);
                task.attributes.push(new TaskAttribute("cx",
                    5000 + oldZViewboxRatio * oldDotMap[region].x,
                    5000 + this.zViewboxRatio * this.dotMap[region].x));
                task.attributes.push(new TaskAttribute("cy",
                    5000 - oldZViewboxRatio * oldDotMap[region].y,
                    5000 - this.zViewboxRatio * this.dotMap[region].y));
                task.attributes.push(new TaskAttribute("r", 0.12 * oldZViewboxRatio, 0.12 * this.zViewboxRatio));
                tasks.push(task)
            }
        }
        if (tasks.length) {
            this.animateService.startTasks(tasks, 300);
        }
        this.updateAvgText();
        this.updateCurrentDot();
    }

    private mouseMove(event: MouseEvent) {
        this.dotHovered(this.getNearestDot(event.offsetX, event.offsetY, 0.2));
    }
    private mouseClick(event: MouseEvent) {
        let dot = this.getNearestDot(event.offsetX, event.offsetY, .5);
        if (this.currentClickDot && this.currentClickDot != dot) {
            let el = document.getElementById("rs-" + this.currentClickDot.region);
            if (el) {
                el.setAttribute("fill", "#0063ff");
            }
        }
        if (dot && this.currentClickDot != dot) {
            let el = document.getElementById("rs-" + dot.region);
            let r = el.getAttribute("r");
            this.removeElement("rs-" + dot.region);
            this.addCircle(dot,<any>r);
            el = document.getElementById("rs-" + dot.region);
            el.setAttribute("fill", "#00a221");
        }
        this.currentClickDot = dot;
        this.updateCurrentDot();
    }
    private getNearestDot(offsetX: number, offsetY: number, minDist: number): Dot {
        let halfWidth = (this.width / 2);
        let ratio = this.maxZ / (this.marginRatio * halfWidth);
        let mouseX = (offsetX - halfWidth) * ratio;
        let mouseY = (halfWidth - offsetY) * ratio;
        let minDot = null;
        for (let region in this.dotMap) {
            let x = this.dotMap[region].x - mouseX;
            let y = this.dotMap[region].y - mouseY;
            let dist = Math.sqrt(x * x + y * y);
            if (dist < minDist) {
                minDist = dist;
                minDot = this.dotMap[region];
            }
        }
        return minDot;
    }
    private updateCurrentDot() {
        if (this.currentHoverDot) {
            this.currentHoverDot = this.dotMap[this.currentHoverDot.region];
        }
        if (this.currentClickDot) {
            this.currentClickDot = this.dotMap[this.currentClickDot.region];
        }
        this.currentDot = this.currentHoverDot ? this.currentHoverDot : this.currentClickDot;
        //this.currentDot = this.currentClickDot ? this.currentClickDot : this.currentHoverDot;
    }
    private dotHovered(dot: Dot) {
        let tasks: Task[] = []
        if (this.currentHoverDot && dot != this.currentHoverDot) {
            let task = new Task("rs-" + this.currentHoverDot.region);
            task.attributes.push(new TaskAttribute("r", 0.18 * this.zViewboxRatio, 0.12 * this.zViewboxRatio));
            task.attributes.push(new TaskAttribute("fill-opacity", 0.9, 0.6));
            tasks.push(task);
        }
        if (dot && dot != this.currentHoverDot) {
            let task = new Task("rs-" + dot.region);
            task.attributes.push(new TaskAttribute("r", 0.12 * this.zViewboxRatio, 0.18 * this.zViewboxRatio));
            task.attributes.push(new TaskAttribute("fill-opacity", 0.6, 0.9));
            tasks.push(task);
        }
        this.currentHoverDot = dot;
        this.updateCurrentDot();
        if (tasks.length) {
            this.animateService.startTasks(tasks, 150);
        }
    }

    private getDotMap(): { [region: string]: Dot } {
        let dotMap = {};
        this.statX.data.forEach(data => {
            let dot = dotMap[data.region];
            if (!dot) {
                dot = new Dot(data.region);
                dotMap[data.region] = dot;
            }
            dot.x = (data.value - this.statX.calc.mean) / this.statX.calc.sd;
            dot.xValue = data.value
        });
        this.statY.data.forEach(data => {
            let dot = dotMap[data.region];
            if (!dot) {
                dot = new Dot(data.region);
                dotMap[data.region] = dot;
            }
            dot.y = (data.value - this.statY.calc.mean) / this.statY.calc.sd;
            dot.yValue = data.value
        });
        return dotMap;
    }

    
    private getBlurFilter(): SVGFilterElement {
        let filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "shadow");
        let feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        feGaussianBlur.setAttribute("result", "blurOut");
        feGaussianBlur.setAttribute("in", "offOut");
        feGaussianBlur.setAttribute("stdDeviation", "2");
        filter.appendChild(feGaussianBlur);
        return filter;
    }

    private addCircle(dot: Dot, r: number) {
        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("fill", "#0063ff");
        circle.setAttribute("r", r.toString());
        circle.setAttribute("cx", (5000 + this.zViewboxRatio * dot.x).toString());
        circle.setAttribute("cy", (5000 - this.zViewboxRatio * dot.y).toString());
        circle.setAttribute("fill-opacity", "0.6");
        circle.setAttribute("id", "rs-" + dot.region);
        this.dotGroup.appendChild(circle);
    }

    private removeElement(id: string) {
        let el = document.getElementById(id);
        if (el) {
            el.parentNode.removeChild(el);
        }
    }
    private removeAllChildren(id: string) {
        let el = document.getElementById(id);
        if (el) {
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }
    }

    private getVerticalLine(x: number, color: string, width: number): SVGLineElement {
        return this.getLine(x, 0, x, 10000, color, width);
    }
    private getHorizontalLine(y: number, color: string, width: number): SVGLineElement {
        return this.getLine(0, y, 10000, y, color, width);
    }
    private getLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number): SVGLineElement {
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1.toString());
        line.setAttribute("y1", y1.toString());
        line.setAttribute("x2", x2.toString());
        line.setAttribute("y2", y2.toString());
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", width.toString());
        return line;
    }

    
    private getMainRect(): SVGRectElement {
        let stroke = 20;
        let mainRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        mainRect.setAttribute("x", (stroke / 2).toString());
        mainRect.setAttribute("y", (stroke / 2).toString());
        mainRect.setAttribute("width", (10000 - stroke).toString());
        mainRect.setAttribute("height", (10000 - stroke).toString());
        mainRect.setAttribute("stroke", "#aaa");
        mainRect.setAttribute("fill", "none");
        mainRect.setAttribute("stroke-width", stroke.toString());
        return mainRect;
    }

    getAxisGroup(): SVGGElement {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.appendChild(this.getHorizontalLine(5000, "red", 20));
        g.appendChild(this.getVerticalLine(5000, "red", 20));
        let xLabelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xLabelText.setAttribute("x", "4490");
        xLabelText.setAttribute("y", "9900");
        xLabelText.setAttribute("font-size", "300")
        xLabelText.setAttribute("fill", "#555")
        xLabelText.innerHTML = "avg";
        g.appendChild(xLabelText);
        let yLabelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yLabelText.setAttribute("x", "50");
        yLabelText.setAttribute("y", "4900");
        yLabelText.setAttribute("font-size", "300")
        yLabelText.setAttribute("fill", "#555")
        yLabelText.innerHTML = "avg";
        g.appendChild(yLabelText);
        return g;
    }

    private updateTrendLine(dotMap: { [region: string]: Dot }) {
        let x2sum = 0;
        let xysum = 0;
        let xsum = 0;
        let ysum = 0;
        let n = 0;
        for (let key in dotMap) {
            let x = dotMap[key].x;
            let y = dotMap[key].y;
            x2sum += x * x;
            xysum += x * y;
            xsum += x;
            ysum += y;
            n++;
        }
        let rise = (n * xysum) - (xsum * ysum);
        let run = (n * x2sum) - (xsum * xsum);
        this.slope = rise / run;
        this.intercept = (ysum - (this.slope * xsum)) / n;
    }
    

    private updateAvgText() {
        let xAvgText: any = document.getElementById("x-avg-text");
        if (!xAvgText){
            xAvgText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            xAvgText.setAttribute("x", "50");
            xAvgText.setAttribute("y", "5300");
            xAvgText.setAttribute("font-size", "300")
            xAvgText.setAttribute("id", "x-avg-text")
            xAvgText.setAttribute("fill", "#555")
        }
        xAvgText.innerHTML = this.metricFormat(this.statY.calc.mean);
        this.axisGroup.appendChild(xAvgText);
        let yAvgText: any = document.getElementById("y-avg-text");
        if (!yAvgText){
            yAvgText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            yAvgText.setAttribute("x", "5050");
            yAvgText.setAttribute("y", "9900");
            yAvgText.setAttribute("font-size", "300")
            yAvgText.setAttribute("id", "y-avg-text")
            yAvgText.setAttribute("fill", "#555")
        }
        yAvgText.innerHTML = this.metricFormat(this.statX.calc.mean);
        this.axisGroup.appendChild(yAvgText);
    }
    public metricFormat(num: number): string {
        let letters = ["", "k", "M", "G", "T", "P"];
        let i = 0;
        while (num >= 1000) {
            num /= 1000;
            i++;
        }
        return parseFloat(num.toPrecision(3)) + letters[i];
    }
}
