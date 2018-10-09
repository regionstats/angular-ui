
import {tap, combineLatest} from 'rxjs/operators';
import { Component, Input, SimpleChange, SimpleChanges, NgZone } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';

import { DataService } from '../services/data.service';
import { Stat, Data } from '@regionstats/models';
import { Color } from '../models/color';
import { AsyncSubject ,  Observable, Subscription } from 'rxjs';
import { ViewBox } from '../models/view-box';
import { MapHelpers } from './map-helpers'

import { Task, TaskAttribute, AnimateService } from '../services/animate.service';
import * as helpers from '../common/helpers'
import { Calculation } from '../models/calculation';

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
    private currentRegionId: number = 1;
    private regionNameToId: { [name: string]: number } = {};
    private idToData: { [id: number]: Data } = {};
    private existingFilterData: Data    [] = [];

    public stat: Stat;
    public calc: Calculation;
    public heightStr: string = "80vh";
    public metricFormat = helpers.metricFormat;

    public currentView: string = "map";
    public selectedData: Data;

    public sdString: string = "";

    private statSubscription: Subscription

    @Input() minColor: Color;
    @Input() midColor: Color;
    @Input() maxColor: Color;
    @Input() colorZRange: number = 2;

    constructor(private dateService: DataService, private animateService: AnimateService, private zone: NgZone) {
        this.minColor = new Color(224, 236, 255);
        this.midColor = new Color(0, 99, 255);
        this.maxColor = new Color(0, 16, 35);
    }

    ngOnInit() {
        this.load().subscribe(() => {
            this.statSubscription = this.dateService.getStats().pipe(combineLatest(this.dateService.getSelectedIndexes())).subscribe(arr => {
                let stats = arr[0];
                let indexes = arr[1];
                let statContainer = stats[indexes[0]];
                this.calc = statContainer.calc;
                this.stat = statContainer.stat;
                if (this.stat) {
                    let colors = {}
                    for (var data of this.stat.data) {
                        let z = (data.v - this.calc.mean) / this.calc.sd;
                        let regionName = helpers.getRegionName(data);
                        let regionId = this.regionNameToId[regionName];
                        var element = document.getElementById("rs-r-" + regionId);
                        if (element){
                            element.setAttribute("fill", this.getColor(z));
                            this.idToData[regionId] = data;
                        } else {
                            console.warn("map has no region for " + regionName);
                        }
                    }
                }
            })

        });


        this.dateService.getStats().subscribe(stats => {
            this.stat = stats[0].stat;
            if (this.stat) {
                this.load();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
    }

    ngOnDestroy(){
        this.statSubscription && this.statSubscription.unsubscribe();
    }

    private load() {
        var url = "assets/Counties.svg";
        //var url = "assets/US.svg"
        return MapHelpers.loadUnsafeSVG(url).pipe(tap(unsafeSVG => {
            let viewBox = new ViewBox(unsafeSVG);
            this.svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            this.svgElement.appendChild(this.defs);
            let unsafeRegionGroup = this.getUnsafeRegionGroup(unsafeSVG);
            this.mapGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.currentRegionId = 1;
            this.copySVGChildren(unsafeRegionGroup, this.mapGroup);
            this.svgElement.appendChild(this.mapGroup);
            //this.copySVGChildren(unsafeSVG, this.svgElement);
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

    private setSelectedData(data: Data){
        if (this.selectedData != data){
            this.zone.run(() => {
                this.selectedData = data;
                if (data){
                    this.sdString = (data.v > this.calc.mean ? "+" : "") + helpers.metricFormat((data.v - this.calc.mean) / this.calc.sd);
                }
            });
        }
    }

    private getColor(z: number) {
        let val: number;
        let newColor: any = {};
        if (z > this.colorZRange){
            newColor.r = newColor.g = newColor.b = 0;
        }
        else if (z < -this.colorZRange){
            newColor.r = newColor.g = newColor.b = 255;
        }
        else if (z >= 0) {
            let ratio = 1 - (this.colorZRange - z) / this.colorZRange;
            newColor.r = (this.midColor.r * (1 - ratio)) + (this.maxColor.r * ratio);
            newColor.g = (this.midColor.g * (1 - ratio)) + (this.maxColor.g * ratio);
            newColor.b = (this.midColor.b * (1 - ratio)) + (this.maxColor.b * ratio);
        } else {
            let ratio = (this.colorZRange + z) / this.colorZRange;
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
    //fill and name excluded
    private svgAttributes = ["d", "style", "item", "transform", "stroke", "stroke-width", "y", "x", "cx", "cy", "r", "height", "width"]
    private copySVGAttributes(unsafe: SVGElement, safe: SVGElement) {
        let fill = "";
        let hasName = false;
        for (var key in unsafe.attributes) {
            let attr = unsafe.attributes[key];
            if (attr.name && attr.value) {
                if (this.svgAttributes.indexOf(attr.name) >= 0) {
                    safe.setAttribute(attr.name, attr.value);
                } else if (attr.name == "name") {
                    hasName = true;
                    var names = attr.value.split("|");
                    names.forEach(name => {
                        this.regionNameToId[name.toLowerCase()] = this.currentRegionId;
                    });
                    safe.setAttribute("id", "rs-r-" + this.currentRegionId)
                    safe.setAttribute("fill", "#bbb");
                    this.zone.runOutsideAngular(() => {
                        safe.addEventListener("mouseenter", this.mouseEnter.bind(this, this.currentRegionId));
                        safe.addEventListener("mouseleave", this.mouseLeave.bind(this, this.currentRegionId))
                    });
                    this.currentRegionId++;
                } else if (attr.name == "fill"){
                    fill = attr.value;
                }
            }
        }
        if (!hasName && fill){
            safe.setAttribute("fill", fill);
        }
    }

    private mouseEnter(id: number, event: MouseEvent) {
        let el = <Element>event.target;
        this.removeElement("rs-r-" + id);
        this.mapGroup.appendChild(el);
        let idString = "filter-r-" + id

        this.setSelectedData(this.idToData[id]);
        let existingFilter = document.getElementById(idString);
        let rect = el.getClientRects()[0];
        if (existingFilter){
            this.existingFilterData.push(this.selectedData);
            this.animateInOffsetFilter(idString, rect.width, rect.height);
        } else {
            el.setAttribute("filter", `url(#${ idString })`)
            let filter = this.getOffsetFilter(idString, rect.width, rect.height);
            this.defs.appendChild(filter);
            this.animateInOffsetFilter(idString, rect.width, rect.height);
        }
    }

    private mouseLeave(id: number) {
        let el = <Element>event.target;
        let idString = "filter-r-" + id;
        let rect = el.getClientRects()[0];

        var tasks: Task[] = [];
        let task = new Task("offset-" + idString);
        task.attributes.push(new TaskAttribute("dx", -3 / rect.width, 0))
        task.attributes.push(new TaskAttribute("dy", -3 / rect.height, 0))
        tasks.push(task);

        task = new Task("blur-" + idString);
        task.attributes.push(new TaskAttribute("slope", 1, 0));
        tasks.push(task);

        let data = this.idToData[id];
        this.animateService.startTasks(tasks, 100, () => {
            var index = this.existingFilterData.indexOf(data);
            if (index == -1){
                if (this.selectedData == data){
                    this.setSelectedData(null);
                }
                el.removeAttribute("filter");
                this.removeElement("filter-r-" + id)
            } else {
                this.existingFilterData.splice(index, 1);
            }
        });
    }

    private getOffsetFilter(id: string, width: number, height: number): SVGFilterElement {
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

        let feComponentTransfer = document.createElementNS("http://www.w3.org/2000/svg", "feComponentTransfer");
        feComponentTransfer.setAttribute("in", "SourceAlpha")
        feComponentTransfer.setAttribute("result", "componentOut")
        let feFuncA = document.createElementNS("http://www.w3.org/2000/svg", "feFuncA");
        feFuncA.setAttribute("id", "blur-" + id);
        feFuncA.setAttribute("type", "linear");
        feFuncA.setAttribute("slope", "0");
        feComponentTransfer.appendChild(feFuncA);

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

        return filter;
    }

    private animateInOffsetFilter(id: string, width: number, height: number) {
        var tasks: Task[] = [];
        
        let task = new Task("offset-" + id);
        task.attributes.push(new TaskAttribute("dx", 0, -3 / width))
        task.attributes.push(new TaskAttribute("dy", 0, -3 / height))
        tasks.push(task);

        task = new Task("blur-" + id);
        task.attributes.push(new TaskAttribute("slope", 0, 1));
        tasks.push(task);

        this.animateService.startTasks(tasks, 100);
    }

    private removeElement(id: string) {
        let el = document.getElementById(id);
        if (el) {
            el.parentNode.removeChild(el);
        }
    }
}
