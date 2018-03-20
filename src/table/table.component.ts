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
    @Input("indexCount") indexCount: number;

    @ViewChild("componentContainer") componentContainer: ElementRef;
    @ViewChild("tableData") tableData: ElementRef;
    @ViewChild("primaryLine") primaryLine: ElementRef;
    @ViewChild("secondaryLine") secondaryLine: ElementRef;

    public tableRowList: TableRow[] = [];
    public tableRowMap: { [region: string]: TableRow } = {};
    public stats: Stat[];
    public rowWidth: string;
    public scrollLeft: number = 0;
    public primaryLineLeft: number = -120;
    public secondaryLineLeft: number = -120;

    private verticalScrollFunctionRef: (e) => {};
    private headerScrollFunctionRefs: Array<(e) => {}> = [];
    private dataScrollFunctionRef: (e) => {};
    private fixedHeader: boolean = false;
    private scrollContainer: HTMLElement;
    private selectedIndexes: number[] = [0, 1];

    constructor(private dataService: DataService) {
    }

    ngOnInit() {
        this.verticalScrollFunctionRef = this.verticallyScrolled.bind(this);
        this.scrollContainer = document.getElementById("scroll-container");
        this.scrollContainer.addEventListener("scroll", this.verticalScrollFunctionRef);

        this.dataService.getSelectedIndexes().subscribe((indexes) => {
            this.selectedIndexes = indexes;
            this.updateLines();
        });
        this.dataService.getStats().subscribe(stats => {
            this.stats = stats;
            this.rowWidth = (stats.length * 120) + "px";
            this.updateTableRows();
            setTimeout(() => {
                let headers = document.getElementsByClassName("table-header");
                for (let i = 0; i < headers.length; i++){
                    let headerScrollFunctionRef = this.headerScrolled.bind(this);
                    headers[i].addEventListener("scroll", headerScrollFunctionRef);
                    this.headerScrollFunctionRefs.push(headerScrollFunctionRef);
                }
                this.dataScrollFunctionRef = this.dataScrolled.bind(this);
                this.tableData.nativeElement.addEventListener("scroll", this.dataScrollFunctionRef);
            });
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        this.updateLines();
    }

    headerClicked(event: MouseEvent, index: number) {
        let takenIndexIndex = this.selectedIndexes.findIndex(z => z == index);
        if (takenIndexIndex == 0) {//clicked on primary index
            return;
        }
        if (takenIndexIndex == -1) {//clicked where there is no selected index
            this.selectedIndexes[0] = index;
        } else {//swap primary with whatever selected index
            let temp = this.selectedIndexes[0];
            this.selectedIndexes[0] = index;
            this.selectedIndexes[takenIndexIndex] = temp;
        }
        this.dataService.setSelectedIndexes(this.selectedIndexes);
    }

    private updateLines() {
        this.primaryLineLeft = (140 + 120 * this.selectedIndexes[0]) - this.scrollLeft;
        if (this.indexCount >= 2) {
            this.secondaryLineLeft = (140 + 120 * this.selectedIndexes[1]) - this.scrollLeft;
        } else {
            this.secondaryLineLeft = -120;
        }
    }

    verticallyScrolled(e: Event) {
        var header = <HTMLDivElement>this.componentContainer.nativeElement;
        if (!this.fixedHeader && this.scrollContainer.scrollTop > header.offsetTop) {
            this.fixedHeader = true;
        } else if (this.fixedHeader && this.scrollContainer.scrollTop < header.offsetTop){
            this.fixedHeader = false;
        }
    }

    headerScrolled(e: Event) {
        this.scrollLeft = (<any>e.target).scrollLeft;
        let headers = document.getElementsByClassName("table-header");
        for (var i = 0; i < headers.length; i++){
            //headerRows[i].setAttribute("style", `margin-left: ${-this.scrollLeft}px; width: ${this.rowWidth};`);
            headers[i].scrollLeft = this.scrollLeft;
        }
        this.tableData.nativeElement.scrollLeft = this.scrollLeft;
        this.updateLines();
    }

    dataScrolled(e: Event) {
        this.scrollLeft = this.tableData.nativeElement.scrollLeft;
        let headers = document.getElementsByClassName("table-header");
        for (var i = 0; i < headers.length; i++){
            //headerRows[i].setAttribute("style", `margin-left: ${-this.scrollLeft}px; width: ${this.rowWidth};`);
            headers[i].scrollLeft = this.scrollLeft;
        }
        this.updateLines();
    }

    updateTableRows() {
        this.tableRowList = [];
        this.tableRowMap = {};
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
