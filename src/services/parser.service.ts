import { Page } from '../models/page';
import { Stat } from '../models/stat';
import { Data } from '../models/data';
import { Source } from '../models/source';
import * as Pako from 'pako';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import { ReplaySubject } from 'rxjs/ReplaySubject';
@Injectable()
export class ParserService{
    public tryParseUrlParam(): object | string {
        let index = window.location.href.indexOf("?") + 1;
        if (!index) {
            return "missing url param";
        }
        let param = window.location.href.substr(index);
        if (!param) {
            return "url param is empty";
        }
        let URIDecoded = decodeURIComponent(param);
        let obj = tryParseObject(URIDecoded);
        if (obj) {
            return obj;
        }
        let base64Decoded = atob(URIDecoded);
        obj = tryParseObject(base64Decoded);
        if (obj) {
            return obj;
        }
        let pakoInflated = tryInflate(base64Decoded);
        obj = tryParseObject(pakoInflated);
        if (obj) {
            return obj;
        }
        return "unable to parse url param";
        function tryParseObject(objectStr: any): object {
            try {
                return JSON.parse(objectStr)
            } catch (e) {
                return null;
            }
        }
        function tryInflate(objectStr: any): string {
            try {
                return Pako.inflate(objectStr, { to: 'string' });
            } catch (e) {
                return "";
            }
        }
    }

    public tryParsePage(obj: any): Observable<Page | string> {
        obj = Object.keys(obj).reduce((a, k) => (a[k.toLowerCase()] = obj[k], a), {});
        let observableArray: Observable<any>[] = []
        let page = new Page();
        let stats = obj.s || obj.stat || obj.stats
        let statsCallback = (input) => {
            return this.optionalHashWrapper(input).switchMap(result => {
                if (typeof result == "object") {
                    return this.tryParseStat(result);
                } else {
                    return Observable.of("stat is not an object");
                }
            });
        }
        let statsObservable = this.optionalHashWrapper(stats)
            .switchMap(input => this.optionalArrayWrapper(input, statsCallback))
            .do(arr => {
                let stats = arr.filter(z => (z instanceof Stat));
                if (stats.length == 0) {
                    return Observable.of("missing stats");
                }
                page.stats = stats;
            });
        return statsObservable.map(arr => {
            //TODO validation
            return page;
        });
    }
    private optionalArrayWrapper(input: any, callback: (input) => Observable<any>): Observable<any[]> {
        if (Array.isArray(input)) {
            let observableArray: Observable<any>[] = [];
            input.forEach(element => {
                observableArray.push(callback(element));
            });
            return Observable.forkJoin(observableArray);
        } else {
            return Observable.forkJoin([callback(input)]);
        }
    }

    private optionalHashWrapper(input: any): Observable<any> {
        if (typeof input == "string" && /^[0-9a-fA-F]{64}/.test(input)) {
            //TODO hashService
            return Observable.of(input); //this.http.get("https://gateway.ipfs.io/ipfs/" + input);
        } else {
            return Observable.of(input);
        }
    }

    private tryParseStat(obj: any): Observable<Stat | string> {
        obj = Object.keys(obj).reduce((a, k) => (a[k.toLowerCase()] = obj[k], a), {});
        let observableArray: Observable<any>[] = []
        let stat = new Stat();
        //TITLE
        let title = obj.t || obj.title;
        if (!title) {
            return Observable.of("title is required")
        }
        if (typeof title != "string") {
            return Observable.of("title must be a string")
        }
        stat.title = title;
        //DATA
        let data = obj.d || obj.data;
        if (!data) {
            return Observable.of("data is required");
        }
        if (typeof data != "object" || !Array.isArray(data)) {
            return Observable.of("data must be an array");
        }
        if (data.length == 0) {
            return Observable.of("data is an empty array")
        }
        let dataArray: Data[] = [];
        data.forEach(element => {
            let result = this.tryParseData(element);
            if (result instanceof Data) {
                dataArray.push(result);
            } 
        });
        stat.data = dataArray;
        //REGION NAME
        let regionName = obj.rn || obj.regionname;
        if (typeof regionName != "string") {
            return Observable.of("region name must be a string")
        }
        stat.regionName = regionName;
        //REGION TYPE
        let regionType = obj.rt || obj.regiontype
        if (typeof regionType == "string") {
            stat.regionType = regionType;
        }
        //YEAR
        let year = obj.y || obj.year;
        if (typeof year == "number") {
            stat.year = year;
        } else if (typeof year == "string" && /^\d{4}$\d/.test(year)) {
            stat.year = parseFloat(year);
        }
        //SOURCE
        let source = obj.s || obj.source
        if (typeof source != "object") {
            return Observable.of("source must be an object");
        }
        let parseSourceResult = this.tryParseSource(source)
        if (parseSourceResult instanceof Source) {
            stat.source = parseSourceResult;
        }
        if (observableArray.length) {
            return Observable.forkJoin(observableArray).map(z => stat);
        }
        return Observable.of(stat);
    }
    //todo: add parent and type
    private tryParseData(obj: any): Data | string {
        obj = Object.keys(obj).reduce((a, k) => (a[k.toLowerCase()] = obj[k], a), {});
        let data = new Data();
        //VALUE
        let value = obj.v || obj.value;
        if (typeof value != "number") {
            return "value must be a number";
        }
        data.value = value;
        //REGION
        let region = obj.r || obj.region;
        if (typeof region != "string") {
            return "region must be a string";
        }
        data.region = region;
        return data;
    }

    private tryParseSource(obj: any): Source | string {
        obj = Object.keys(obj).reduce((a, k) => (a[k.toLowerCase()] = obj[k], a), {});
        let source = new Source();
        //TITLE
        let title = obj.t || obj.title;
        if (typeof title != "string") {
            return "title must be a string";
        }
        source.title = title;
        //YEAR
        let year = obj.y || obj.year;
        if (typeof year == "number") {
            source.year = year;
        } else if (typeof year == "string" && /^\d{4}$\d/.test(year)) {
            source.year = parseFloat(year);
        }
        //PUBLISHER
        let publisher = obj.p || obj.publisher;
        if (typeof publisher == "string") {
            source.publisher = publisher;
        }
        //URL
        let url = obj.u || obj.url;
        if (typeof url == "string") {
            source.url = url;
        }
        return source;
    }
}