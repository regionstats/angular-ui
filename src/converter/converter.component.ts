import { Component, Input, SimpleChange, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import * as Pako from 'pako';
import { ParserService } from '../services/parser.service'
import { HashService } from '../services/hash.service'
import { Stat } from '@regionstats/models';
import { Source } from '../models/source';
import { Data } from '../models/data';
import readXlsxFile from 'read-excel-file';
import { BlockRenderComponent } from '../common/block-render.component';
import { Observable, forkJoin } from 'rxjs';
import { validateStatArrayAsync } from '@regionstats/validator';
import { map } from 'rxjs/operators';
import { StatContainer } from '../models/stat-container';

@Component({
    selector: 'converter-component',
    templateUrl: './converter.component.html',
})
export class ConverterComponent {
    public json: string;
    public url: string;
    public urlMessage: string;
    public jsonMessage: string;
    public isJsonMessageWarning: boolean;
    public dictionary: string;
    public urlLength: number;
    public jsonLength: number;
    public tab: string = "main";

    public statContainers: StatContainer[] = [];
    public selectedStatContainer: StatContainer;
    public statMessage: string;

    constructor(private parserService: ParserService, private hashService: HashService) {
    }

    ngOnInit() {
        this.url = window.location.href;
        let stat = new Stat();
        stat.title = "Title of Your Stat";
        stat.regionName = "United States";
        stat.regionType = "State"
        stat.source = new Source();
        this.selectedStatContainer = {stat: stat};
        this.statContainers.push(this.selectedStatContainer)
    }
    convertToJson() {
        var urlParseResult = this.parserService.tryParseUrlParam(this.url, this.dictionary);
        if (typeof urlParseResult == "string") {
            this.jsonLength = null;
            this.urlMessage = urlParseResult;
        } else {
            this.urlLength = this.url.length - this.url.indexOf("?") - 1;
            this.jsonLength = JSON.stringify(urlParseResult).length;
            this.json = JSON.stringify(urlParseResult, null, 5);
            this.jsonMessage = "";
            this.urlMessage = "";
        }
    }
    generateUrl() {
        try {
            var obj = JSON.parse(this.json)
        } catch (e) {
            this.urlLength = null;
            this.jsonMessage = e.message;
            return;
        }
        let jsonStr = JSON.stringify(obj);
        this.jsonLength = jsonStr.length;
        let deflatedStr = Pako.deflate(jsonStr, { to: 'string', dictionary: this.dictionary });
        let base64 = btoa(deflatedStr);
        let urlParam = encodeURIComponent(base64);
        this.urlLength = urlParam.length;
        this.url = window.location.origin + "/?" + urlParam;
        this.jsonMessage = "";
        this.urlMessage = "";
    }

    jsonToForm() {
        if (!this.json) {
            this.jsonMessage = "JSON is empty";
            return;
        }
        try {
            var obj = JSON.parse(this.json)
        } catch (e) {
            this.jsonMessage = e.message;
            return;
        }
        this.parserService.tryParsePage(obj).subscribe(result => {
            if (typeof result == "string") {
                this.jsonMessage = result;
                return;
            }
            this.jsonMessage = "";
            this.statMessage = "";
            this.statContainers = result.statContainers;
            this.selectedStatContainer = this.statContainers[0];
        })
    }

    formToJson() {
        this.statMessage = "";
        let stats = this.statContainers.map(z => z.hash ? z.hash : z.stat);
        validateStatArrayAsync(stats, this.hashService.get.bind(this.hashService)).subscribe(err => {
            if (err){
                this.statMessage = err;
                var arr = /(\d+):/.exec(err);
                if (arr[1]){
                    var index = parseInt(arr[1]) - 1;
                    if (!isNaN(index) && index < this.statContainers.length){
                        this.selectedStatContainer = this.statContainers[index];
                    }
                }
            } else {
                this.jsonMessage = "";
                this.jsonLength = JSON.stringify({ stats: stats }).length;
                this.json = JSON.stringify({ stats: stats }, null, 5);
            }
        });
    }

    addStat() {
        let stat = new Stat();
        stat.title = "";
        stat.regionName = "United States";
        stat.regionType = "State"
        stat.source = new Source();
        this.selectedStatContainer = {stat: stat};
        this.statContainers.push(this.selectedStatContainer);
        this.tab = "main";
        setTimeout(() => {
            let el = document.getElementById("stat-title-input");
            if (el) {
                el.focus();
            }
        })
    }

    removeStat() {
        let index = this.statContainers.indexOf(this.selectedStatContainer);
        this.statContainers.splice(index, 1);
        if (!this.statContainers[index]) {
            index--;
        }
        this.selectedStatContainer = this.statContainers[index];
    }
}