import { Component, Input, SimpleChange, SimpleChanges, ViewChild, ElementRef } from '@angular/core';

import { HttpClient } from '@angular/common/http'
import { DataService } from '../services/data.service';
import { Stat } from '../models/stat';
import { Color } from '../models/color';
import { AsyncSubject } from 'rxjs';
import { TableRow } from './table-row';

@Component({
    selector: 'table-component',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss']
})
export class TableComponent {
    @Input() stats: Stat[];
    @ViewChild("staticHeader") staticHeader: ElementRef;

    public tableRowList: TableRow[] = [];
    public tableRowMap: { [region: string]: TableRow } = {};

    private scrollFunctionRef: (e) => {};
    private fixedHeader: boolean = false;
    private scrollContainer: HTMLElement;
    

    constructor() {
    }

    ngOnInit() {
        this.scrollFunctionRef = this.scrolled.bind(this);
        this.scrollContainer = document.getElementById("scroll-container");
        this.scrollContainer.addEventListener("scroll", this.scrollFunctionRef);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.stats) {
            this.updateTableRows();
        }
    }

    scrolled(e: Event) {
        var header = <HTMLDivElement>this.staticHeader.nativeElement;
        console.log(this.scrollContainer.scrollTop, header.offsetTop)
        if (!this.fixedHeader && this.scrollContainer.scrollTop > header.offsetTop) {
            //header.setAttribute("style", "position: fixed");
            this.fixedHeader = true;
            console.log("fixed", this.scrollContainer.scrollTop, header.offsetTop)
        } else if (this.fixedHeader && this.scrollContainer.scrollTop < header.offsetTop){
            //header.setAttribute("style", "")
            this.fixedHeader = false;
            console.log("not fixed", this.scrollContainer.scrollTop, header.offsetTop)
        }
    }

    updateTableRows() {
        this.stats.forEach(stat => {
            stat.data.forEach(data => {
                var tableRow = this.tableRowMap[data.region];
                if (!tableRow) {
                    tableRow = new TableRow(data.region);
                    this.tableRowMap[data.region] = tableRow;
                    this.tableRowList.push(tableRow);
                }
                tableRow.values.push(data.value);
            })
        });
    }
}
