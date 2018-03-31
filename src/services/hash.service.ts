import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AsyncSubject } from 'rxjs/AsyncSubject';


@Injectable()
export class HashService {
    constructor(private http: HttpClient) {
        
    }
    hashValues: {[hash: string]: any} = {};
    activeRequests: { [hash: string]: AsyncSubject<any>} = {};

    get(hash: string): Observable<any> {
        if (this.hashValues[hash]) {
            return Observable.of(this.hashValues[hash])
        }
        if (this.activeRequests[hash]) {
            return this.activeRequests[hash].asObservable();
        }
        let subject = new AsyncSubject<any>();
        this.activeRequests[hash] = subject;
        this.http.get("https://gateway.ipfs.io/ipfs/" + hash).subscribe(result => {
            subject.next(result);
            subject.complete();
            delete this.activeRequests[hash];
        })
        return subject.asObservable();
    }
}