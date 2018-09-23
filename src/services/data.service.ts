
import { StatContainer } from '../models/stat-container';
import { Observable ,  ReplaySubject ,  BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { ParserService } from './parser.service';
import { HashService } from './hash.service';
import { validatePageAsync } from '@regionstats/validator';
import { Stat } from '@regionstats/models';
import { Page } from '../models/page';
import { Calculation } from '../models/calculation';


@Injectable()
export class DataService {
    private statsSubject: ReplaySubject<StatContainer[]> = new ReplaySubject<StatContainer[]>();
    private selectedIndexesSubject: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([0, 1]);
    private statContainers: StatContainer[];

    constructor(private parserService: ParserService, private hashService: HashService) { }

    private setStats(statContainers: StatContainer[]){
        this.statContainers = statContainers;
        this.statsSubject.next(statContainers);
    }

    public getStats(): Observable<StatContainer[]> {
        return this.statsSubject.asObservable();
    }

    public getSelectedIndexes(): Observable<number[]>{
        return this.selectedIndexesSubject.asObservable();
    }

    public setSelectedIndexes(indexes: number[]) {
        if (indexes.length > 0 && indexes.every(i => i >= 0 && i < this.statContainers.length)) {
            this.selectedIndexesSubject.next(indexes);
        }
    }

    public init(): Observable<string> {
        return new Observable((observer) => {
            let urlParseResult = this.parserService.tryParseUrlParam(window.location.href);
            if (typeof urlParseResult == "string") {
                observer.next(urlParseResult);
                return;
            }
            this.parserService.tryParsePage(urlParseResult).subscribe(result => {
                if (typeof result == "string"){
                    this.setStats(null);
                    observer.next(result);
                } else {
                    result.stats.forEach((statContainer: StatContainer) => {
                        statContainer.calc = new Calculation(statContainer.stat.data);
                    });
                    this.setStats(result.stats);
                    observer.next(null)
                }
            })
        });
    }
}