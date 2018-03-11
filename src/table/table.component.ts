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
    @ViewChild("staticHeader") staticHeader: ElementRef;
    @ViewChild("tableData") tableData: ElementRef;

    public tableRowList: TableRow[] = [];
    public tableRowMap: { [region: string]: TableRow } = {};
    public stats: Stat[];
    public scrollLeft: number;
    public rowWidth: string;

    private verticalScrollFunctionRef: (e) => {};
    private horizontalScrollFunctionRef: (e) => {};
    private fixedHeader: boolean = false;
    private scrollContainer: HTMLElement;

    constructor(private dateService: DataService) {
    }

    ngOnInit() {
        this.verticalScrollFunctionRef = this.verticallyScrolled.bind(this);
        this.scrollContainer = document.getElementById("scroll-container");
        this.scrollContainer.addEventListener("scroll", this.verticalScrollFunctionRef);

        this.dateService.getStats().subscribe(stats => {
            this.stats = stats;
            this.rowWidth = (stats.length * 6) + "rem";
            this.updateTableRows();
            setTimeout(() => {
                this.horizontalScrollFunctionRef = this.horizontallyScrolled.bind(this);
                this.tableData.nativeElement.addEventListener("scroll", this.horizontalScrollFunctionRef);
            });
        });
    }

    verticallyScrolled(e: Event) {
        var header = <HTMLDivElement>this.staticHeader.nativeElement;
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

    horizontallyScrolled(e: Event) {
        this.scrollLeft = this.tableData.nativeElement.scrollLeft;
        console.log("horiz scroll", this.scrollLeft)
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
