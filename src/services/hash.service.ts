
import {of as observableOf,  Observable ,  AsyncSubject } from 'rxjs';

import {timeout} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class HashService {
    constructor(private http: HttpClient) {
        
    }
    hashValues: {[hash: string]: any} = {};
    activeRequests: { [hash: string]: AsyncSubject<any>} = {};

    get(hash: string): Observable<any> {
        if (this.hashValues[hash]) {
            return observableOf(this.hashValues[hash])
        }
        if (this.activeRequests[hash]) {
            return this.activeRequests[hash].asObservable();
        }
        let subject = new AsyncSubject<any>();
        this.activeRequests[hash] = subject;
        this.http.get("https://ipfs.io/ipfs/" + hash).pipe(timeout(10000)).subscribe(result => {
            this.hashValues[hash] = result; 
            subject.next(this.hashValues[hash]);
            subject.complete();
            delete this.activeRequests[hash];
        }, error => {
            this.hashValues[hash] = new HashError(hash); 
            subject.next(this.hashValues[hash]);
            subject.complete();
            delete this.activeRequests[hash];
        })
        return subject.asObservable();
    }
}
export class HashError{
    hash: string;
    constructor(hash: string) {
        this.hash = hash;
    }
}