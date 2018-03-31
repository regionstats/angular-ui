import { Component, Input, SimpleChange, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import * as Pako from 'pako';
import { ParserService } from '../services/parser.service'
import { Stat } from '../models/stat';
import { Page } from '../models/page';
import { Source } from '../models/source';
import { Data } from '../models/data';

@Component({
    selector: 'converter-component',
    templateUrl: './converter.component.html',
})
export class ConverterComponent {
    public json: string;
    public url: string;
    public urlMessage: string;
    public jsonMessage: string;
    public dictionary: string;
    public urlLength: number;
    public jsonLength: number;
    public tab: string = "main";

    public stats: Stat[] = [];
    public selectedStat: Stat;
    public statMessage: string;
    public tsv: string = null;
    public tsvMessage: string;

    constructor(private parserService: ParserService) {
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
        let deflatedStr = Pako.deflate(jsonStr, { to: 'string',  dictionary: this.dictionary});
        let base64 = btoa(deflatedStr);
        let urlParam = encodeURIComponent(base64);
        this.urlLength = urlParam.length;
        this.url = window.location.origin + "/?" + urlParam;
        this.jsonMessage = "";
        this.urlMessage = "";
    }

    fillInForm() {
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
        this.parserService.tryParsePage(obj).subscribe((pageParseResult) => {
            if (typeof pageParseResult == "string") {
                this.jsonMessage = pageParseResult;
                return;
            }
            this.jsonMessage = "";
            this.statMessage = "";
            this.stats = pageParseResult.stats;
            this.selectedStat = this.stats[0];
        });
    }

    formToJson() {
        this.statMessage = "";
        this.stats.forEach((stat, i) => {
            if (!stat.title) {
                this.selectedStat = stat;
                this.statMessage = "Stat " + (i + 1) + " has no title";
                this.tab = "main";
                return false;
            }
        });
        if (this.statMessage) {
            return;
        }
        this.stats.forEach((stat, i) => {
            if (!stat.data || !stat.data.length) {
                this.selectedStat = stat;
                this.statMessage = "Stat " + (i + 1) + " has no data";
                this.tab = "data";
                return false;
            }
        });
        if (this.statMessage) {
            return;
        }
        this.stats.forEach((stat, i) => {
            stat.data.forEach((data, j) => {
                if (!data.region) {
                    this.statMessage = "Stat " + (i + 1) + " row " + (j + 1) + " has no " + stat.regionType;
                }
                if (stat.regionIntermediary && !data.parent) {
                    this.statMessage = "Stat " + (i + 1) + " row " + (j + 1) + " has no " +  stat.regionIntermediary;
                }
                if (this.statMessage) {
                    this.selectedStat = stat;
                    this.tab = "data";
                    return false;
                }
            })
            return this.statMessage;
        });

        this.jsonMessage = "";
        this.jsonLength = JSON.stringify({stats: this.stats}).length;
        this.json = JSON.stringify({stats: this.stats}, null, 5);
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

    tsvChanged(tsv: string) {
        this.tsv = typeof this.tsv == "string" ? null : "";
    }

    tsvPaste(event: ClipboardEvent) {
        let str = event.clipboardData.getData("text");
        if (!str) {
            this.tsvMessage = "No Text in Clipboard";
            return;
        }
        let hasInter = this.selectedStat.regionIntermediary ? 1 : 0;
        let dataArray: Data[] = [];
        let rows = str.split(/[\r\n]+/g);
        rows.forEach((row, i) => {
            if (row.length == 0 && dataArray.length) {
                return false;
            }
            let columns = row.split("\t");
            if (columns.length < 2 + hasInter) {
                this.tsvMessage = "Error in Row " + (i + 1) + ": row must have " + (2 + hasInter) + " columns";
                return false;
            }
            if (columns[0].length == 0) {
                this.tsvMessage = "Error in Row " + (i + 1) + ", Col A: cell is empty";
                return false;
            }
            if (columns[1].length == 0) {
                this.tsvMessage = "Error in Row " + (i + 1) + ", Col B: cell is empty";
                return false;
            }
            if (hasInter && columns[2].length == 0) {
                this.tsvMessage = "Error in Row " + (i + 1) + ", Col C: cell is empty";
                return false;
            }
            let matches = columns[1 + hasInter].trim().replace(",", "").match(/^([0-9.]+) ?%?$/);
            if (!matches) {
                this.tsvMessage = "Error in Row " + (i + 1) + ', Col B: "' + columns[1 + hasInter] + '" is not a valid number';
                return false;
            }
            let data = new Data();
            data.region = columns[0 + hasInter];
            data.value = parseFloat(columns[1 + hasInter]);
            if (hasInter) {
                data.parent = columns[0];
            }
            dataArray.push(data);
        });
        if (this.selectedStat.data && this.selectedStat.data) {
            this.selectedStat.data = this.selectedStat.data.concat(dataArray)
        } else {
            this.selectedStat.data = dataArray;
        }
    }

    addData() {
        if (!this.selectedStat.data) {
            this.selectedStat.data = [new Data()];
        } else {
            this.selectedStat.data.unshift(new Data());
        }
    }
    removeData(index: number) {
        this.selectedStat.data.splice(index, 1);
    }
    removeAllData() {
        this.selectedStat.data = [];
    }
}
