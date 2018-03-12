
import { Page } from '../models/page';
import { Stat } from '../models/stat';
import * as Pako from 'pako';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { ParserService } from './parser.service';
import { Calculation } from '../models/calculation';


@Injectable()
export class DataService {
    private statsSubject: ReplaySubject<Stat[]> = new ReplaySubject<Stat[]>();
    private page: Page


    constructor(private parserService: ParserService) { }

    public getStats(): Observable<Stat[]> {
        return this.statsSubject.asObservable();
    }

    public loadPage(): void {
        let urlParseResult = this.parserService.tryParseUrlParam(window.location.href);
        if (typeof urlParseResult == "string") {
            console.log("failed to get urlParam", urlParseResult)
        } else {
            this.parserService.tryParsePage(urlParseResult).subscribe(page => {
                if (typeof page == "string") {
                    console.log("failed to get page", page)
                    this.statsSubject.next(null);
                } else {
                    this.page = page;
                    page.stats.forEach(z => {
                        z.calc = new Calculation(z.data);
                    })
                    this.statsSubject.next(page.stats);
                }
            })
        }
    }
}