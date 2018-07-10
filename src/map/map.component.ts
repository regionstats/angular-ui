
import {tap, combineLatest} from 'rxjs/operators';
import { Component, Input, SimpleChange, SimpleChanges } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';

import { DataService } from '../services/data.service';
import { Stat } from '../models/stat';
import { Color } from '../models/color';
import { AsyncSubject ,  Observable } from 'rxjs';
import { ViewBox } from '../models/view-box';
import { MapHelpers } from './map-helpers'

import { Task, TaskAttribute, AnimateService } from '../services/animate.service';
import { Data } from '../models/data';

@Component({
    selector: 'map-component',
    templateUrl: './map.component.html'
})
export class MapComponent {
    @ViewChild('svgContainer') svgContainer: ElementRef;

    private svgElement: SVGSVGElement;
    private defs: SVGDefsElement
    private mapGroup: SVGGElement;
    private regions: { [name: string]: SVGElement } = {}; 
    
    public stat: Stat;
    public heightStr: string = "80vh";

    public currentView: string = "map";

    @Input() minColor: Color;
    @Input() midColor: Color;
    @Input() maxColor: Color;

    constructor(private dateService: DataService, private animateService: AnimateService) {
        this.minColor = new Color(224, 236, 255);
        this.midColor = new Color(0, 99, 255);
        this.maxColor = new Color(0, 16, 35);
    }

    ngOnInit() {
        this.load().subscribe(() => {
            this.dateService.getStats().pipe(combineLatest(this.dateService.getSelectedIndexes())).subscribe(arr => {
                let stats = arr[0];
                let indexes = arr[1];
                this.stat = stats[indexes[0]];
                if (this.stat) {
                    let calc = this.stat.calc;
                    let range = calc.max.v - calc.min.v;
                    let zScores = {}
                    let colors = {}
                    for (var key in this.stat.data) {
                        zScores[key.toLowerCase()] = (this.stat.data[key].v - calc.mean) / calc.sd;
                        let ratio = (this.stat.data[key].v - calc.min.v) / range
                        colors[this.getRegionId(this.stat.data[key])] = this.getColor(ratio);
                    }
                    this.setColors(colors);
                }
            })

        });


        this.dateService.getStats().subscribe(stats => {
            this.stat = stats[0];
            if (this.stat) {
                this.load();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log("changes", changes, this.stat);
    }

    private getRegionId(data: Data): string {
        if (data.i) {
            return data.r.replace(/ /g, "-").toLowerCase() + "," + data.i.replace(/ /g, "-").toLowerCase();
        }
        return data.r.replace(/ /g, "-").toLowerCase()
    }

    private load() {
        //var url = "assets/Counties.svg";
        var url = "assets/US.svg"
        return MapHelpers.loadUnsafeSVG(url).pipe(tap(unsafeSVG => {
            let viewBox = new ViewBox(unsafeSVG);
            this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            this.svgElement.appendChild(this.defs);
            let unsafeRegionGroup = this.getUnsafeRegionGroup(unsafeSVG);
            this.mapGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.copySVGChildren(unsafeRegionGroup, this.mapGroup);
            this.svgElement.appendChild(this.mapGroup);
            this.copySVGChildren(unsafeSVG, this.svgElement);
            this.svgElement.setAttribute("width", "100%");
            this.svgElement.setAttribute("height", "100%");
            this.svgElement.setAttribute("viewBox", viewBox.toString());
            this.svgContainer.nativeElement.appendChild(this.svgElement);
            this.setHeight(viewBox.height() / viewBox.width());
        }))
    }

    // height/width
    private setHeight(ratio: number) {
        let width = document.getElementById("scroll-container").clientWidth
        let height = document.documentElement.clientHeight;
        let svgHeight = width * ratio;
        if (svgHeight < height * .8) {
            this.heightStr = svgHeight + "px";
        } else {
            this.heightStr = "80vh";
        }
    }

    private getColor(ratio) {
        let val: number;
        let newColor: any = {};
        if (ratio >= 0.5) {
            ratio = (ratio * 2) - 1; //ratio now 0 through 1
            newColor.r = (this.midColor.r * (1 - ratio)) + (this.maxColor.r * ratio);
            newColor.g = (this.midColor.g * (1 - ratio)) + (this.maxColor.g * ratio);
            newColor.b = (this.midColor.b * (1 - ratio)) + (this.maxColor.b * ratio);
        } else {
            ratio = ratio * 2; //ratio now 0 through 1
            newColor.r = (this.minColor.r * (1 - ratio)) + (this.midColor.r * ratio);
            newColor.g = (this.minColor.g * (1 - ratio)) + (this.midColor.g * ratio);
            newColor.b = (this.minColor.b * (1 - ratio)) + (this.midColor.b * ratio);
        }

        return "#" + (Math.floor(newColor.r / 16)).toString(16) + Math.floor(newColor.r % 16).toString(16)
            + (Math.floor(newColor.g / 16)).toString(16) + Math.floor(newColor.g % 16).toString(16)
            + (Math.floor(newColor.b / 16)).toString(16) + Math.floor(newColor.b % 16).toString(16);
    }

    public setColors(obj) {
        for (var key in obj) {
            if (this.regions[key]) {
                this.regions[key].setAttribute("fill",obj[key]);
            }
        }
    }
    private getUnsafeRegionGroup(unsafe: SVGElement): SVGElement {
        for (var i = 0; i < unsafe.children.length; i++) {
            let unsafeChild = unsafe.children[i];
            let id = unsafeChild.getAttribute("id");
            if (id == "region-group") {
                unsafe.removeChild(unsafeChild);
                return <SVGElement>unsafeChild;    
            }
        }
        return unsafe;
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
                //console.log("unsupported tag", unsafeChild.tagName, unsafeChild.children.length)
            }
        }
    }

    //tags in popular wikipedia maps:
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
                    let regionName = attr.value.replace(/ /g, "-").toLowerCase();
                    safe.setAttribute("id", "rs-" + regionName)
                    this.regions[regionName] = safe;
                    safe.addEventListener("mouseenter", this.mouseEnter.bind(this, regionName));
                    safe.addEventListener("mouseleave", this.mouseLeave.bind(this, regionName))
                }
            }
        }
    }

    private mouseEnter(key: string) {
        let el = this.regions[key];
        this.removeElement("rs-" + key);
        this.mapGroup.appendChild(el);
        this.regions[key] = el;
        let id = "filter-" + key
        el.setAttribute("filter", `url(#${ id })`)
        let rect = el.getClientRects()[0];
        let filter = this.getOffsetFilter(id, rect.width, rect.height)
        this.defs.appendChild(this.getOffsetFilter(id, rect.width, rect.height));
    }

    private mouseLeave(key: string) {
        let el = this.regions[key];
        let id = "filter-" + key;
        let rect = el.getClientRects()[0];

        var tasks: Task[] = [];
        let task = new Task("offset-" + id);
        task.attributes.push(new TaskAttribute("dx", -3 / rect.width, 0))
        task.attributes.push(new TaskAttribute("dy", -3 / rect.height, 0))
        tasks.push(task);

        task = new Task("blur-" + id);
        task.attributes.push(new TaskAttribute("slope", 1, 0));
        tasks.push(task);

        this.animateService.startTasks(tasks, 100, () => {
            el.removeAttribute("filter");
            this.removeElement("filter-" + key)
        });
    }

    private getOffsetFilter(id: string, width: number, height: number): SVGFilterElement {
        var tasks: Task[] = [];

        let filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", id);
        filter.setAttribute("x", "-.5");
        filter.setAttribute("y", "-.5");
        filter.setAttribute("width", "2");
        filter.setAttribute("height", "2");
        filter.setAttribute("primitiveUnits", "objectBoundingBox");

        let feOffset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
        feOffset.setAttribute("id", "offset-" + id);
        feOffset.setAttribute("result", "offOut");
        feOffset.setAttribute("in", "SourceGraphic");
        feOffset.setAttribute("dx", "0");
        feOffset.setAttribute("dy", "0");
        feOffset.setAttribute("result", "offOut");
        
        let task = new Task("offset-" + id);
        task.attributes.push(new TaskAttribute("dx", 0, -3 / width))
        task.attributes.push(new TaskAttribute("dy", 0, -3 / height))
        tasks.push(task);

        let feComponentTransfer = document.createElementNS("http://www.w3.org/2000/svg", "feComponentTransfer");
        feComponentTransfer.setAttribute("in", "SourceAlpha")
        feComponentTransfer.setAttribute("result", "componentOut")
        let feFuncA = document.createElementNS("http://www.w3.org/2000/svg", "feFuncA");
        feFuncA.setAttribute("id", "blur-" + id);
        feFuncA.setAttribute("type", "linear");
        feFuncA.setAttribute("slope", "0");
        feComponentTransfer.appendChild(feFuncA);

        task = new Task("blur-" + id);
        task.attributes.push(new TaskAttribute("slope", 0, 1));
        tasks.push(task);

        let feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        feGaussianBlur.setAttribute("in", "componentOut");
        feGaussianBlur.setAttribute("result", "blurOut");
        feGaussianBlur.setAttribute("stdDeviation",(10 / (width + height)).toString());

        let feBlend = document.createElementNS("http://www.w3.org/2000/svg", "feBlend");
        feBlend.setAttribute("in", "offOut");
        feBlend.setAttribute("in2", "blurOut");
        feBlend.setAttribute("mode", "normal");

        filter.appendChild(feOffset);
        filter.appendChild(feComponentTransfer);
        filter.appendChild(feGaussianBlur);
        filter.appendChild(feBlend);

        this.animateService.startTasks(tasks, 100);
        return filter;
    }

    private removeElement(id: string) {
        let el = document.getElementById(id);
        if (el) {
            el.parentNode.removeChild(el);
        }
    }
}
