
import { Page } from '../models/page';
import { Stat } from '../models/stat';
import { Observable ,  ReplaySubject ,  BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { ParserService } from './parser.service';
import { HashService } from './hash.service';
import { validatePageAsync } from '@regionstats/validator';
import { Calculation } from '../models/calculation';


@Injectable()
export class DataService {
    private statsSubject: ReplaySubject<Stat[]> = new ReplaySubject<Stat[]>();
    private selectedIndexesSubject: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([0, 1]);
    private page: Page

    constructor(private parserService: ParserService, private hashService: HashService) { }

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

    public loadPage(): Observable<string> {
        return new Observable((observer) => {
            let urlParseResult = this.parserService.tryParseUrlParam(window.location.href);
            if (typeof urlParseResult == "string") {
                observer.next(urlParseResult);
            } else {
                validatePageAsync(urlParseResult, this.hashService.get.bind(this.hashService)).subscribe(err => {
                    if (err) {
                        this.statsSubject.next(null);
                    } else {
                        this.page = urlParseResult as Page;
                        this.page.stats.forEach(z => {
                            z.calc = new Calculation(z.data);
                        })
                        this.statsSubject.next(this.page.stats);
                    }
                    observer.next(err);
                })
            }
        });
    }
}