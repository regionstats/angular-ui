
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
}