
import { Page } from '../models/page';
import { Stat } from '../models/stat';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { ParserService, ParseResult } from './parser.service';
import { Calculation } from '../models/calculation';
import { BehaviorSubject } from 'rxjs';


@Injectable()
export class DataService {
    private statsSubject: ReplaySubject<Stat[]> = new ReplaySubject<Stat[]>();
    private selectedIndexesSubject: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([0, 1]);
    private page: Page

    constructor(private parserService: ParserService) { }

    public getStats(): Observable<Stat[]> {
        return this.statsSubject.asObservable();
    }

    public getSelectedIndexes(): Observable<number[]>{
        return this.selectedIndexesSubject.asObservable();
    }

    public setSelectedIndexes(indexes: number[]) {
        if (indexes.length > 0 && indexes.every(i => i >= 0 && i < this.page.stats.length)) {
            this.selectedIndexesSubject.next(indexes);
        }
    }

    public loadPage(): Observable<ParseResult<Page>> {
        return new Observable((observer) => {
            let urlParseResult = this.parserService.tryParseUrlParam(window.location.href);
            if (typeof urlParseResult == "string") {
                observer.next(new ParseResult<Page>("error", null, [urlParseResult]));
            } else {
                this.parserService.tryParsePage(urlParseResult).subscribe(parseResult => {
                    if (parseResult.status == "error") {
                        this.statsSubject.next(null);
                        observer.next(parseResult);
                    } else {
                        this.page = parseResult.result;
                        this.page.stats.forEach(z => {
                            z.calc = new Calculation(z.data);
                        })
                        this.statsSubject.next(this.page.stats);
                        observer.next(parseResult);
                    }
                })
            }
        });
    }
}