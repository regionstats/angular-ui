import { Component, Input, SimpleChange, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import * as Pako from 'pako';
import { ParserService } from '../services/parser.service'
import { HashService } from '../services/hash.service'
import { Stat } from '../models/stat';
import { Page } from '../models/page';
import { Source } from '../models/source';
import { Data } from '../models/data';
import readXlsxFile from 'read-excel-file';
import { BlockRenderComponent } from '../common/block-render.component';
import { Observable, forkJoin } from 'rxjs';
import { validatePageAsync, validateStatAsync } from '@regionstats/validator';
import { map } from 'rxjs/operators';

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

    public stats: Stat[] = [];
    public selectedStat: Stat;
    public statMessage: string;

    constructor(private parserService: ParserService, private hashService: HashService) {
    }

    ngOnInit() {
        this.url = window.location.href;
        this.selectedStat = new Stat();
        this.selectedStat.title = "Title of Your Stat";
        this.selectedStat.regionName = "United States";
        this.selectedStat.regionType = "State"
        this.selectedStat.source = new Source();
        this.stats.push(this.selectedStat);
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
        validatePageAsync(obj, this.hashService.get.bind(this.hashService)).subscribe(err => {
            if (err) {
                this.jsonMessage = err;
                return;
            }
            this.jsonMessage = "";
            this.statMessage = "";
            this.stats = (obj as Page).stats;
            this.selectedStat = this.stats[0];
        });
    }

    formToJson() {
        this.statMessage = "";
        validatePageAsync({ stats: this.stats }, this.hashService.get.bind(this.hashService)).subscribe(err => {
            if (err){
                this.statMessage = err;
                var arr = /(\d+):/.exec(err);
                if (arr[1]){
                    var index = parseInt(arr[1]) - 1;
                    if (!isNaN(index) && index < this.stats.length){
                        this.selectedStat = this.stats[index];
                    }
                }
            } else {
                this.jsonMessage = "";
                this.jsonLength = JSON.stringify({ stats: this.stats }).length;
                this.json = JSON.stringify({ stats: this.stats }, null, 5);
            }
        });
    }

    addStat() {
        this.selectedStat = new Stat();
        this.selectedStat.title = "";
        this.selectedStat.regionName = "United States";
        this.selectedStat.regionType = "State"
        this.selectedStat.source = new Source();
        this.tab = "main";
        this.stats.push(this.selectedStat);
        setTimeout(() => {
            let el = document.getElementById("stat-title-input");
            if (el) {
                el.focus();
            }
        })
    }

    removeStat() {
        let index = this.stats.indexOf(this.selectedStat);
        this.stats.splice(index, 1);
        if (!this.stats[index]) {
            index--;
        }
        this.selectedStat = this.stats[index];
    }
}