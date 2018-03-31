import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import * as Pako from 'pako';

import { HttpClient } from '@angular/common/http'
import { DataService } from './services/data.service';
import { Stat } from './models/stat';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent {
    public currentView: "map" | "scatterplot" | "converter" | "loading" = "loading";
    public noData = false;

    constructor(private http: HttpClient, private dataService: DataService) {
    }

    ngOnInit() {
        this.dataService.loadPage().subscribe((result) => {
            if (typeof result == "string") {
                this.currentView = "converter"
                this.noData = true;
            } else {
                this.currentView = "map";
            }
        });
    }
}
