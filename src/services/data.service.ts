
import { Page } from '../models/page';
import { Stat } from '../models/stat';
import * as Pako from 'pako';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { ParserService } from './parser.service';
import { Calculation } from '../models/calculation';
import { BehaviorSubject } from 'rxjs';


@Injectable()
export class DataService {
    private statsSubject: ReplaySubject<Stat[]> = new ReplaySubject<Stat[]>();
    private primaryIndexSubject: BehaviorSubject<number> = new BehaviorSubject<number>(0);
    private page: Page

    constructor(private parserService: ParserService) { }

    public getStats(): Observable<Stat[]> {
        return this.statsSubject.asObservable();
    }

    public getPrimaryIndex(): Observable<number>{
        return this.primaryIndexSubject.asObservable();
    }

    public setPrimaryIndex(index: number) {
        if (index >= 0 && index < this.page.stats.length)
        this.primaryIndexSubject.next(index);
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