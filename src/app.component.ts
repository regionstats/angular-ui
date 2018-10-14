import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { DataService } from './services/data.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    public currentView: "map" | "scatterplot" | "converter" | "loading" = "loading";
    public noData = false;

    constructor(private http: HttpClient, private dataService: DataService, private changeDetector: ChangeDetectorRef) {
    }

    ngOnInit() {
        this.dataService.init().subscribe((err) => {
            if (err) {
                this.currentView = "converter"
                this.noData = true;
            } else {
                this.currentView = "map";
            }
            this.changeDetector.detectChanges();
        });
    }
}
