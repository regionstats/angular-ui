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

@Component({
    selector: 'scatterplot-component',
    templateUrl: './scatterplot.component.html'
})
export class ScatterplotComponent {
    @ViewChild('svgContainer') svgContainer: ElementRef;

    public heightStr: string = "80vh";
    public dotArray: Dot[] = [];
    public dotMap: { [region: string]: Dot } = {};

    private statX: Stat;
    private statY: Stat;

    private svgElement: SVGSVGElement;
    private lineGroup: SVGGElement;
    private dotGroup: SVGGElement;
    private defs: SVGDefsElement
    private maxZ: number;
    private zRatio: number;
    private marginRatio: number = 0.95;

    constructor(private dateService: DataService) {
    }

    ngOnInit() {
        this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        this.svgElement.appendChild(this.defs);
        this.lineGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svgElement.appendChild(this.lineGroup);
        this.dotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svgElement.appendChild(this.dotGroup);
        let mainRect = this.getMainRect();
        this.svgElement.appendChild(mainRect);
        this.svgElement.setAttribute("width", "100%");
        this.svgElement.setAttribute("height", "100%");
        this.svgElement.setAttribute("viewBox", "0 0 10000 10000");
        this.svgContainer.nativeElement.appendChild(this.svgElement);


        this.dateService.getStats().subscribe(stats => {
            this.statX = stats[0];
            this.statY = stats[1];
            if (this.statX && this.statY) {
                this.updateDotCollections();
                this.updateDotGroup();
                this.updateLineGroup();
            }
        });
    }

    private load() {

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

    private updateDotCollections() {
        this.dotArray = [];
        this.dotMap = {};
        this.statX.data.forEach(data => {
            let dot = this.dotMap[data.region];
            if (!dot) {
                dot = new Dot(data.region);
                this.dotMap[data.region] = dot;
                this.dotArray.push(dot);
            }
            dot.x = (data.value - this.statX.calc.mean) / this.statX.calc.sd;
            dot.xValue = data.value
        });
        this.statY.data.forEach(data => {
            let dot = this.dotMap[data.region];
            if (!dot) {
                dot = new Dot(data.region);
                this.dotMap[data.region] = dot;
                this.dotArray.push(dot);
            }
            dot.y = (data.value - this.statY.calc.mean) / this.statY.calc.sd;
            dot.yValue = data.value
        });
        this.dotArray = this.dotArray.filter(dot => {
            if (dot.x == null || dot.y == null) {
                delete this.dotArray[dot.region];
                return false;
            }
            return true;
        });
        let maxZX = Math.max(...this.dotArray.map(z => Math.abs(z.x)));
        let maxZY = Math.max(...this.dotArray.map(z => Math.abs(z.y)));
        this.maxZ = Math.max(maxZX, maxZY);
        this.zRatio = 5000 * this.marginRatio / this.maxZ;
    }

    private updateDotGroup() {
        this.dotArray.forEach(dot => {
            let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("fill", "#0063ff");
            circle.setAttribute("r", "100");
            circle.setAttribute("cx", (5000 + this.zRatio * dot.x).toString());
            circle.setAttribute("cy", (5000 - this.zRatio * dot.y).toString())
            this.dotGroup.appendChild(circle);
        })
    }

    private updateLineGroup() {
        let width = 50;
        let gray = "#ccc";
        for (var i = 1; i < this.maxZ / this.marginRatio; i++) {
            this.addHorizontalLine(5000 - (i * this.zRatio), gray, 10);
            this.addHorizontalLine(5000 + (i * this.zRatio), gray, 10);
            this.addVerticalLine(5000 - (i * this.zRatio), gray, 10);
            this.addVerticalLine(5000 + (i * this.zRatio), gray, 10);
        }
        this.addHorizontalLine(5000, "red", 20);
        this.addVerticalLine(5000, "red", 20);
    }
    private addVerticalLine(x: number, color: string, width: number) {
        this.addLine(x, 0, x, 10000, color, width);
    }
    private addHorizontalLine(y: number, color: string, width: number) {
        this.addLine(0, y, 10000, y, color, width);
    }
    private addLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1.toString());
        line.setAttribute("y1", y1.toString());
        line.setAttribute("x2", x2.toString());
        line.setAttribute("y2", y2.toString());
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", width.toString());
        this.lineGroup.appendChild(line);
    }
}
