import * as Pako from 'pako';
import { Injectable } from '@angular/core';
import { HashService, HashError } from './hash.service';
import { validateStatArrayAsync } from '@regionstats/validator';
import { Stat } from '@regionstats/models';
import { Page } from '../models/page';
import { Observable, of, forkJoin } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { StatContainer } from '../models/stat-container';
import { AnyObject } from '../models/any-object';


@Injectable()
export class ParserService {
    constructor(private hashService: HashService) {
    }
    tryParseUrlParam(url: string, dictionary?: string): AnyObject | string {
        let index = url.indexOf("?") + 1;
        if (!index) {
            return "missing url param";
        }
        let param = url.substr(index);
        if (!param) {
            return "url param is empty";
        }
        let URIDecoded = decodeURIComponent(param);
        let obj = this.tryParseObject(URIDecoded);
        if (obj) {
            return obj;
        }
        let base64Decoded = this.tryBase64Decode(URIDecoded);
        obj = this.tryParseObject(base64Decoded);
        if (obj) {
            return obj;
        }
        let pakoInflated = this.tryInflate(base64Decoded);
        obj = this.tryParseObject(pakoInflated);
        if (obj) {
            return obj;
        }
        if (dictionary) {
            let pakoDictInflated = this.tryInflate(base64Decoded, dictionary);
            obj = this.tryParseObject(pakoDictInflated);
            if (obj) {
                return obj;
            }
        }
        return "unable to parse url param";
    }
    tryParsePage(obj: AnyObject): Observable<Page | string> {
        return validateStatArrayAsync(obj.stats, this.hashService.get.bind(this.hashService)).pipe(
            concatMap(err => {
                if (err) {
                    return of(err);
                } 
                var observables: Observable<StatContainer>[] = [];
                (<any>obj).stats.forEach((statOrHash: Stat | string) => {
                    if (typeof statOrHash == "string"){
                        observables.push(this.hashService.get(statOrHash).pipe(
                            map((stat: Stat) => { 
                                var container = new StatContainer();
                                container.hash = statOrHash
                                container.stat = stat
                                return container
                            })
                        ));
                    } else {
                        var container = new StatContainer();
                        container.stat = statOrHash
                        observables.push(of(container));
                    }
                });
                return forkJoin(observables).pipe(
                    map((arr: StatContainer[]) => { 
                        var page = new Page();
                        page.statContainers = arr;
                        return page;
                    })
                );
            })
        );
    }

    tryBase64Decode(str: any): string {
        try {
            return atob(str);
        } catch (e) {
            return "";
        }
    }

    tryParseObject(objectStr: any): object {
        try {
            return JSON.parse(objectStr)
        } catch (e) {
            return null;
        }
    }
    tryInflate(objectStr: any, dictionary?: string): string {
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