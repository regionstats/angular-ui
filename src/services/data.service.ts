
import { Page } from '../models/page';
import { Stat } from '../models/Stat';
import * as Pako from 'pako';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { ParserService } from './parser.service';


@Injectable()
export class DataService {
    public statsSubject: ReplaySubject<Stat[]> = new ReplaySubject<Stat[]>();
    public page: Page


    constructor(private parserService: ParserService) { }

    public loadPage(): void {
        let urlParseResult = this.parserService.tryParseUrlParam();
        if (typeof urlParseResult == "string") {
            console.log("failed to get urlParam", urlParseResult)
        } else {
            this.parserService.tryParsePage(urlParseResult).subscribe(page => {
                if (typeof page == "string") {
                    console.log("failed to get page", page)
                    this.statsSubject.next(null);
                } else {
                    this.page = page;
                    this.statsSubject.next(page.stats);
                }
            })
        }
    }

    
}