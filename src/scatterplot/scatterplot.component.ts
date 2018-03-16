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

    public heightStr: string = "80vh";
    public dotMap: { [region: string]: Dot } = {};

    private statX: Stat;
    private statY: Stat;

    private svgElement: SVGSVGElement;
    private sdMarkersGroup: SVGGElement;
    private axisGroup: SVGGElement;
    private dotGroup: SVGGElement;
    private defs: SVGDefsElement
    private maxZ: number = 3;
    private zRatio: number;
    private marginRatio: number;

    constructor(private dateService: DataService, private animateService: AnimateService) {
        this.marginRatio = .95;
        this.maxZ = 3;
        this.zRatio = 5000 * this.marginRatio / this.maxZ;
    }

    ngOnInit() {
        this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        this.svgElement.appendChild(this.defs);
        this.sdMarkersGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svgElement.appendChild(this.sdMarkersGroup);
        this.sdMarkersGroup.setAttribute("id", "sd-markers-group");
        this.axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.axisGroup.appendChild(this.getHorizontalLine(5000, "red", 20));
        this.axisGroup.appendChild(this.getVerticalLine(5000, "red", 20));
        this.svgElement.appendChild(this.axisGroup);
        this.dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svgElement.appendChild(this.dotGroup);
        let mainRect = this.getMainRect();
        this.svgElement.appendChild(mainRect);
        this.svgElement.setAttribute("width", "100%");
        this.svgElement.setAttribute("height", "100%");
        this.svgElement.setAttribute("viewBox", "0 0 10000 10000");
        this.svgContainer.nativeElement.appendChild(this.svgElement);
        this.dateService.getStats().combineLatest(this.dateService.getSelectedIndexes()).subscribe(arr => {
            let stats = arr[0];
            let indexes = arr[1];
            this.statX = stats[indexes[0]];
            this.statY = stats[indexes[1]];
            this.statsChanged();
        });
        this.setHeight();
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

    // height/width
    private setHeight() {
        let width = document.getElementById("scroll-container").clientWidth
        let height = document.documentElement.clientHeight;
        if (width < height * .8) {
            this.heightStr = width + "px";
        } else {
            this.heightStr = "80vh";
        }
    }
    private statsChanged() {
        let newDotMap = this.getDotMap();
        for (let id in this.dotMap) {
            if (!newDotMap[id]) {
                this.removeElement("rs-" + id);
            }
        }
        let oldZRatio = this.zRatio;
        let oldMaxZ = this.maxZ;
        let maxZX = Math.max(...Object.keys(newDotMap).map(id => Math.abs(newDotMap[id].x)));
        let maxZY = Math.max(...Object.keys(newDotMap).map(id => Math.abs(newDotMap[id].y)));
        this.maxZ = Math.max(maxZX, maxZY);
        this.zRatio = 5000 * this.marginRatio / this.maxZ;
        let tasks: Task[] = [];
        console.log(oldZRatio, this.zRatio)
        //this.removeAllChildren("sd-markers-group");
        //this.updateSdMarkers(tasks);
        for (var i = 1; i < Math.max(this.maxZ, oldMaxZ) / this.marginRatio; i++) {
            let el = document.getElementById("zx-minus-" + i);
            if (!el) {
                let line = this.getVerticalLine(5000 - (i * oldZRatio), "gray", 10);
                line.setAttribute("id", "zx-minus-" + i);
                this.sdMarkersGroup.appendChild(line);
            }
            let task = new Task("zx-minus-" + i);
            task.attributes.push(new TaskAttribute("x1", 5000 - (i * oldZRatio), 5000 - (i * this.zRatio)));
            task.attributes.push(new TaskAttribute("x2", 5000 - (i * oldZRatio), 5000 - (i * this.zRatio)));
            tasks.push(task);

            el = document.getElementById("zx-plus-" + i);
            if (!el) {
                let line = this.getVerticalLine(5000 + (i * oldZRatio), "gray", 10);
                line.setAttribute("id", "zx-plus-" + i);
                this.sdMarkersGroup.appendChild(line);
            }
            task = new Task("zx-plus-" + i);
            task.attributes.push(new TaskAttribute("x1", 5000 + (i * oldZRatio), 5000 + (i * this.zRatio)));
            task.attributes.push(new TaskAttribute("x2", 5000 + (i * oldZRatio), 5000 + (i * this.zRatio)));
            tasks.push(task);

            el = document.getElementById("zy-plus-" + i);
            if (!el) {
                let line = this.getHorizontalLine(5000 + (i * oldZRatio), "gray", 10);
                line.setAttribute("id", "zy-plus-" + i);
                this.sdMarkersGroup.appendChild(line);
            }
            task = new Task("zy-plus-" + i);
            task.attributes.push(new TaskAttribute("y1", 5000 - (i * oldZRatio), 5000 - (i * this.zRatio)));
            task.attributes.push(new TaskAttribute("y2", 5000 - (i * oldZRatio), 5000 - (i * this.zRatio)));
            tasks.push(task);

            el = document.getElementById("zy-minus-" + i);
            if (!el) {
                let line = this.getHorizontalLine(5000 + (i * oldZRatio), "gray", 10);
                line.setAttribute("id", "zy-minus-" + i);
                this.sdMarkersGroup.appendChild(line);
            }
            task = new Task("zy-minus-" + i);
            task.attributes.push(new TaskAttribute("y1", 5000 + (i * oldZRatio), 5000 + (i * this.zRatio)));
            task.attributes.push(new TaskAttribute("y2", 5000 + (i * oldZRatio), 5000 + (i * this.zRatio)));
            tasks.push(task);
        }


        for (let region in newDotMap) {
            if (!this.dotMap[region]) {
                this.addCircle(newDotMap[region], 300 / this.maxZ);
            } else {
                let task = new Task("rs-" + region);
                task.attributes.push(new TaskAttribute("cx",
                    5000 + oldZRatio * this.dotMap[region].x,
                    5000 + this.zRatio * newDotMap[region].x));
                task.attributes.push(new TaskAttribute("cy",
                    5000 - oldZRatio * this.dotMap[region].y,
                    5000 - this.zRatio * newDotMap[region].y));
                task.attributes.push(new TaskAttribute("r", 300 / oldMaxZ, 300 / this.maxZ));
                tasks.push(task)
            }
        }
        
        if (tasks.length) {
            this.animateService.startTasks(tasks, 300, 10);
        }
        this.dotMap = newDotMap;
    }
    private getMarkerTask() {
        
    }

    private getDotMap() {
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

    private addCircle(dot: Dot, r: number) {
        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("fill", "#0063ff");
        circle.setAttribute("r", r.toString());
        circle.setAttribute("cx", (5000 + this.zRatio * dot.x).toString());
        circle.setAttribute("cy", (5000 - this.zRatio * dot.y).toString())
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
}
