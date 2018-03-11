import { Component, Input, SimpleChange, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import * as Pako from 'pako';
import { ParserService } from '../services/parser.service'

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

    constructor(private parserService: ParserService) {
    }

    ngOnInit() {
        this.url = window.location.href;
    }
    convertToJson() {
        console.log("TESTING", this.url)
        var urlParseResult = this.parserService.tryParseUrlParam(this.url, this.dictionary);
        console.log(urlParseResult)
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
        let deflatedStr = Pako.deflate(jsonStr, { to: 'string' });
        let base64 = btoa(deflatedStr);
        let urlParam = encodeURIComponent(btoa(Pako.deflate(jsonStr, { to: 'string', dictionary: this.dictionary })));
        this.urlLength = urlParam.length;
        this.url = window.location.origin + "/?" + urlParam;
        this.jsonMessage = "";
        this.urlMessage = "";
    }
}
