import { Component, Input, SimpleChange, SimpleChanges, ViewChild, ElementRef } from '@angular/core';

import { HttpClient } from '@angular/common/http'
import { DataService } from '../services/data.service';
import { Stat } from '../models/Stat';
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
    

    constructor() {
    }

    ngOnInit() {
        this.scrollFunctionRef = this.scrolled.bind(this);
        document.addEventListener("scroll", this.scrollFunctionRef);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.stats) {
            this.updateTableRows();
        }
    }

    scrolled(e: Event) {
        var header = <HTMLDivElement>this.staticHeader.nativeElement;
        console.log(window.pageYOffset, header.offsetTop)
        if (!this.fixedHeader && window.pageYOffset > header.offsetTop) {
            //header.setAttribute("style", "position: fixed");
            this.fixedHeader = true;
            console.log("fixed", window.pageYOffset, header.offsetTop)
        } else if (this.fixedHeader && window.pageYOffset < header.offsetTop){
            //header.setAttribute("style", "")
            this.fixedHeader = false;
            console.log("not fixed", window.pageYOffset, header.offsetTop)
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
