
import {of as observableOf,  Observable ,  AsyncSubject } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { config } from '../app.config';
import { AddStatRequest } from '@regionstats/models';

@Injectable()
export class APIService {
    constructor(private http: HttpClient) {
        
    }

    addStat(request: AddStatRequest){
        return this.http.post(config.api + "/stat", request, {responseType: 'text'});
    }
}