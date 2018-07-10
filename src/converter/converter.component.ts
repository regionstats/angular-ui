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
import { Observable } from 'rxjs';
import { validatePageAsync } from '@regionstats/validator';

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
    public tsv: string = null;
    public dataLoadError: string;
    public fileUploadHover: boolean;
    public isDragging: boolean;

    public letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    startAtRow: number = 1;
    selectedRegionColumn: string = 'A';
    selectedValueColumn: string = 'B';
    selectedIntermediaryColumn: string = 'Filename';

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
        let deflatedStr = Pako.deflate(jsonStr, { to: 'string',  dictionary: this.dictionary});
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
                if (!data.r) {
                    this.statMessage = "Stat " + (i + 1) + " row " + (j + 1) + " has no " + stat.regionType;
                }
                if (stat.regionIntermediary && !data.i) {
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

    spreadsheetPaste(event: ClipboardEvent) {
        this.dataLoadError = "";
        let str = event.clipboardData.getData("text");
        if (!str) {
            this.dataLoadError = "No Text in Clipboard";
            return;
        }
        let intermediary = null;
        if (this.selectedStat.regionIntermediary) {
            intermediary = this.selectedIntermediaryColumn.charCodeAt(0) - 65;
            if (this.selectedIntermediaryColumn == "Filename") {
                this.dataLoadError = "Intermediary region cannot be 'Filename' for pasted data";
                return;
            }
        }
        let input = str.split(/[\r\n]+/g).filter(row => row).map(row => {
            return row.split("\t");
        });
        let result = this.InputToData(input, intermediary);
        if (typeof result == "string") {
            this.dataLoadError = "Error in " + result;
            return;
        }
        this.selectedStat.data = this.selectedStat.data ? this.selectedStat.data.concat(result) : result;
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

    fileChange(event) {
        this.readAllFiles(event.target.files);
    }
    dragEnter(event: DragEvent) {
        if (this.isFileDrag(event)) {
            this.isDragging = true;
        }
    }
    dragLeave(event: DragEvent) {
        if (this.isFileDrag(event)) {
            this.isDragging = false;
        }
    }
    dragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }
    drop(event: DragEvent) {
        if (this.isFileDrag(event)) {
            this.readAllFiles(event.dataTransfer.files);
        }
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }
    private isFileDrag(event: DragEvent) {
        if (event.dataTransfer.types) {
            return event.dataTransfer.types.some(z => z== "Files")
        }
        return false;
    }
    private readAllFiles(files: FileList) {
        this.dataLoadError = "";
        for (var i = 0; i < files.length; i++){
            if (this.getFileType(files[i]) == FileType.other) {
                this.dataLoadError = `File ${files.length == 1 ? '' : (i + 1) + ' '}must be a csv or .xlsx`;
                return;
            }
        }
        let readRecursive = (index: number) => {
            let type = this.getFileType(files[index]);
            if (type == FileType.excel) {
                readXlsxFile(files[index]).then(input => {
                    processInput(index, input);
                }, error => {
                    this.dataLoadError = `Error excel-parsing file '${index + 1}'`;
                })
            }
            if (type == FileType.text) {
                let reader = new FileReader();
                reader.readAsText(files[index]);
                reader.onload = () => {
                    let input = this.csvToArray(reader.result);
                    processInput(index, input);
                };
            }
        }
        let processInput = (index: number, input: string[][]) => {
            let intermediary = null;
            if (this.selectedStat.regionIntermediary) {
                intermediary = this.selectedIntermediaryColumn.charCodeAt(0) - 65;
                if (this.selectedIntermediaryColumn == "Filename") {
                    intermediary = files[index].name.match(/([^.]*)/)[0];
                }
            }
            let result = this.InputToData(input, intermediary);
            if (typeof result == "string") {
                this.dataLoadError = `Error parsing file '${files[index].name}' in ` + result;
                return;
            }
            this.selectedStat.data = this.selectedStat.data ? this.selectedStat.data.concat(result) : result;
            if (index + 1 < files.length) {
                readRecursive(index + 1);
            }
        }
        readRecursive(0);
    }


    private getFileType(file: File): FileType {
        if (file.type.startsWith("text") || file.name.endsWith(".csv")) {
            return FileType.text;
        }
        else if (file.name.endsWith(".xlsx") || file.type.startsWith("application/vnd.openxmlformats-officedoc")){
            return FileType.excel;
        } 
        return FileType.other;
    }

    private InputToData(input: string[][], regionIntermediary?: string | number): Data[] | string {
        let regionIndex = this.selectedRegionColumn.charCodeAt(0) - 65;
        let valueIndex = this.selectedValueColumn.charCodeAt(0) - 65;
        let dataArray: Data[] = [];
        for (var i = 0; i < input.length; i++) {
            let data = new Data();
            if (i + 1 < this.startAtRow) {
                continue;
            }
            if (typeof regionIntermediary == "string") {
                data.i = regionIntermediary;
            } else if (typeof regionIntermediary == "number") {
                if (regionIntermediary >= input[i].length) {
                    return `Row ${i + 1}, Col ${String.fromCharCode(regionIntermediary + 65)}: row is only ${input[i].length} columns wide`;
                }
                if (!input[i][regionIntermediary]) {
                    return `Row ${i + 1}, Col ${String.fromCharCode(regionIntermediary+65)}: cell is empty`;
                }
                data.i = input[i][regionIntermediary];
            }
            if (regionIndex >= input[i].length) {
                return `Row ${i + 1}, Col ${String.fromCharCode(regionIndex+65)}: row is only ${input[i].length} columns wide`;
            }
            if (!input[i][regionIndex]) {
                return `Row ${i + 1}, Col ${String.fromCharCode(regionIndex+65)}: cell is empty`;
            }
            data.r = input[i][regionIndex];
            if (valueIndex >= input[i].length) {
                return `Row ${i + 1}, Col ${String.fromCharCode(valueIndex+65)}: row is only ${input[i].length} columns wide`;
            }
            let noCommas = input[i][valueIndex].trim().replace(",", "")
            let matches = noCommas.match(/^([0-9.]+) ?%?$/);
            if (!matches) {
                return `Row ${i + 1}, Col ${String.fromCharCode(valueIndex + 65)}: '${input[i][valueIndex]}' is not a valid number`;
            }
            data.v = parseFloat(noCommas);
            dataArray.push(data);
        };
        return dataArray;
    }


    //from csv-to-array https://code.google.com/archive/p/csv-to-array
    private csvToArray(csv: string, o?): Array<string[]> {
        var f, p, q, c;
        var od = {
            'fSep': ',',
            'rSep': '\r\n',
            'quot': '"',
            'head': false,
            'trim': false
        }
        if (o) {
            for (var i in od) {
                if (!o[i]) o[i] = od[i];
            }
        } else {
            o = od;
        }
        var a = [
            ['']
        ];
        for (var r = f = p = q = 0; p < csv.length; p++) {
            switch (c = csv.charAt(p)) {
            case o.quot:
                if (q && csv.charAt(p + 1) == o.quot) {
                    a[r][f] += o.quot;
                    ++p;
                } else {
                    q ^= 1;
                }
                break;
            case o.fSep:
                if (!q) {
                    if (o.trim) {
                        a[r][f] = a[r][f].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                    }
                    a[r][++f] = '';
                } else {
                    a[r][f] += c;
                }
                break;
            case o.rSep.charAt(0):
                if (!q && (!o.rSep.charAt(1) || (o.rSep.charAt(1) && o.rSep.charAt(1) == csv.charAt(p + 1)))) {
                    if (o.trim) {
                        a[r][f] = a[r][f].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                    }
                    a[++r] = [''];
                    a[r][f = 0] = '';
                    if (o.rSep.charAt(1)) {
                        ++p;
                    }
                } else {
                    a[r][f] += c;
                }
                break;
            default:
                a[r][f] += c;
            }
        }
        if (o.head) {
            a.shift()
        }
        if (a[a.length - 1].length < a[0].length) {
            a.pop()
        }
        return a;
    }
}

enum FileType{
    excel,
    text,
    other
}
