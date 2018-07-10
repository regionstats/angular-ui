
import {of as observableOf, forkJoin as observableForkJoin,  Observable ,  ReplaySubject } from 'rxjs';

import {map, switchMap} from 'rxjs/operators';
import { Page } from '../models/page';
import { Stat } from '../models/stat';
import { Data } from '../models/data';
import { Source } from '../models/source';
import * as Pako from 'pako';
import { Injectable } from '@angular/core';
import { HashService, HashError } from './hash.service';
@Injectable()
export class ParserService {
    constructor(private hashService: HashService) {
    }

    public tryParseUrlParam(url: string, dictionary?: string): object | string {
        let index = url.indexOf("?") + 1;
        if (!index) {
            return "missing url param";
        }
        let param = url.substr(index);
        if (!param) {
            return "url param is empty";
        }
        let URIDecoded = decodeURIComponent(param);
        let obj = tryParseObject(URIDecoded);
        if (obj) {
            return obj;
        }
        let base64Decoded = tryBase64Decode(URIDecoded);
        obj = tryParseObject(base64Decoded);
        if (obj) {
            return obj;
        }
        let pakoInflated = tryInflate(base64Decoded);
        obj = tryParseObject(pakoInflated);
        if (obj) {
            return obj;
        }
        if (dictionary) {
            let pakoDictInflated = tryInflate(base64Decoded, dictionary);
            obj = tryParseObject(pakoDictInflated);
            if (obj) {
                return obj;
            }
        }
        return "unable to parse url param";
        function tryBase64Decode(str: any): string {
            try {
                return atob(str);
            } catch (e) {
                return "";
            }
        }
    
        function tryParseObject(objectStr: any): object {
            try {
                return JSON.parse(objectStr)
            } catch (e) {
                return null;
            }
        }
        function tryInflate(objectStr: any, dictionary?: string): string {
            try {
                if (dictionary) {
                    return Pako.inflate(objectStr, { to: 'string', dictionary: dictionary });
                }
                return Pako.inflate(objectStr, { to: 'string' });
            } catch (e) {
                return "";
            }
        }
    }

    public tryParsePage(obj: any): Observable<ParseResult<Page>> {
        obj = Object.keys(obj).reduce((a, k) => (a[k.toLowerCase()] = obj[k], a), {});
        let page = new Page();
        let stats = obj.s || obj.stat || obj.stats
        let statsCallback = (input) => {
            return this.optionalHashWrapper(input).pipe(switchMap(result => {
                if (result instanceof HashError) {
                    return observableOf(new ParseResult<Stat>("error", null, [`failed to load stat from IPFS using hash ${result.hash}`]));
                }
                if (result && typeof result == "object") {
                    return this.tryParseStat(result);
                } else {
                    return observableOf(new ParseResult<Stat>("error", null, ["stat is not an object"]));
                }
            }));
        }
        let statsObservable: Observable<ParseResult<Stat>[]> = this.optionalHashWrapper(stats).pipe(
            switchMap(input => this.optionalArrayWrapper(input, statsCallback)));
        return statsObservable.pipe(map(parseResults => {
            //TODO validation
            let errorMessages = [];
            parseResults.forEach(parseResult => {
                if (parseResult.errorMessages) {
                    errorMessages = errorMessages.concat(parseResult.errorMessages);
                }
            })
            let stats = parseResults.filter(z => z.result).map(z => z.result);
            if (stats.length == 0) {
                return new ParseResult<Page>("error", null, errorMessages);
            }
            page.stats = stats;
            if (errorMessages.length) {
                return new ParseResult<Page>("warn", page, errorMessages);
            }
            return new ParseResult<Page>("success", page);
        }));
    }
    private optionalArrayWrapper(input: any, callback: (input) => Observable<any>): Observable<any[]> {
        if (Array.isArray(input)) {
            return observableForkJoin(input.map(z => callback(z)));
        } else {
            return observableForkJoin([callback(input)]);
        }
    }

    private optionalHashWrapper(input: any): Observable<any> {
        if (typeof input == "string" && /^[0-9a-zA-Z]{46}/.test(input)) {
            return this.hashService.get(input);
        } else {
            return observableOf(input);
        }
    }

    private tryParseStat(obj: any): Observable<ParseResult<Stat>> {
        obj = Object.keys(obj).reduce((a, k) => (a[k.toLowerCase()] = obj[k], a), {});
        let stat = new Stat();
        //TITLE
        let title = obj.t || obj.title;
        if (!title) {
            return observableOf(new ParseResult<Stat>("error", null, ["title is required"]))
        }
        if (typeof title != "string") {
            return observableOf(new ParseResult<Stat>("error", null, ["stat title must be a string"]))
        }
        stat.title = title;
        //DATA
        let data = obj.d || obj.data;
        if (!data) {
            return observableOf(new ParseResult<Stat>("error", null, ["data is required"]));
        }
        if (typeof data != "object" || !Array.isArray(data)) {
            return observableOf(new ParseResult<Stat>("error", null, ["data must be an array"]));
        }
        if (data.length == 0) {
            return observableOf(new ParseResult<Stat>("error", null, ["data is an empty array"]))
        }
        let dataArray: Data[] = [];
        let errorMessages: string[] = [];
        data.forEach(element => {
            let parseResult = this.tryParseData(element);
            if (parseResult.status != "error") {
                dataArray.push(parseResult.result);
            } else if (parseResult.errorMessages) {
                errorMessages = errorMessages.concat(parseResult.errorMessages)
            }
        });
        if (!dataArray.length) {
            return observableOf(new ParseResult<Stat>("error", null, this.shrinkErrorMessages(errorMessages)));
        }
        stat.data = dataArray;
        //REGION NAME
        let regionName = obj.rn || obj.regionname;
        if (typeof regionName != "string") {
            return observableOf(new ParseResult<Stat>("error", null, ["region name must be a string"]))
        }
        stat.regionName = regionName;
        //REGION TYPE
        let regionType = obj.rt || obj.regiontype
        if (typeof regionType == "string") {
            stat.regionType = regionType;
        }
        //REGION INTERMEDIARY
        let regionIntermediary = obj.ri || obj.regionintermediary
        if (typeof regionIntermediary == "string") {
            stat.regionIntermediary = regionIntermediary;
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
            errorMessages.push("source must be an object");
        } else {
            let parseResult = this.tryParseSource(source)
            if (parseResult.status != "error") {
                stat.source = parseResult.result;
            } else if (parseResult.errorMessages) {
                errorMessages = errorMessages.concat(parseResult.errorMessages)
            }
        }
        if (!stat.source) {
            stat.source = new Source();
        }
        if (errorMessages.length) {
            return observableOf(new ParseResult<Stat>("warn", stat, errorMessages));
        }
        return observableOf(new ParseResult<Stat>("success", stat));
    }
    //todo: add type
    private tryParseData(obj: any): ParseResult<Data> {
        obj = Object.keys(obj).reduce((a, k) => (a[k.toLowerCase()] = obj[k], a), {});
        let data = new Data();
        //VALUE
        let value = obj.v || obj.value;
        if (typeof value != "number") {
            return new ParseResult<Data>("error", null, ["value must be a number"]);
        }
        data.value = value;
        //REGION
        let region = obj.r || obj.region;
        if (typeof region != "string") {
            return new ParseResult<Data>("error", null, ["region must be a string"]);
        }
        if (!region) {
            return new ParseResult<Data>("error", null, ["region is an empty string"]);
        }
        data.region = region;
        //PARENT
        let parent = obj.p || obj.parent;
        if (typeof parent == "string") {
            data.parent = parent;
        }
        return new ParseResult<Data>("success", data);
    }

    private tryParseSource(obj: any): ParseResult<Source> {
        obj = Object.keys(obj).reduce((a, k) => (a[k.toLowerCase()] = obj[k], a), {});
        let source = new Source();
        //TITLE
        let title = obj.t || obj.title;
        if (typeof title == "string") {
            source.title = title;
        }
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
        return new ParseResult<Source>("success", source);
    }

    private shrinkErrorMessages(messages: string[]) {
        if (messages.length <= 4) {
            return messages;
        }
        return messages.slice(0, 3).concat([`and ${messages.length - 3} more errors`]);
    }
}

export class ParseResult<T> {
    status: "success" | "warn" | "error";
    result: T;
    errorMessages: string[];
    constructor(status: "success" | "warn" | "error", result: T, errorMessages?: string[]) {
        this.status = status;
        this.result = result;
        this.errorMessages = errorMessages;
    }
}