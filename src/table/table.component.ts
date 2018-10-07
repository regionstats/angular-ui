import { Component, Input, SimpleChange, SimpleChanges, ViewChild, ElementRef } from '@angular/core';

import { HttpClient } from '@angular/common/http'
import { DataService } from '../services/data.service';
import { Stat } from '@regionstats/models';
import { Color } from '../models/color';
import { AsyncSubject } from 'rxjs';
import { TableRow } from './table-row';
import * as helpers from '../common/helpers';

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
    public scrollbarWidth: number = 0;

    private verticalScrollFunctionRef: (e) => {};
    private headerScrollFunctionRefs: Array<(e) => {}> = [null, null];
    private dataScrollFunctionRef: (e) => {};
    private fixedHeader: boolean = false;
    private scrollContainer: HTMLElement;
    private selectedIndexes: number[] = [0, 1];
    private updateLineTimeout: any;
    private destroyed: boolean = false;

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
        this.dataService.getStats().subscribe(statContainers => {
            this.stats = statContainers.map(z => z.stat);
            this.rowWidth = (this.stats.length * 120) + "px";
            this.updateTableRows();
            setTimeout(() => {
                if (this.destroyed){
                    return;
                }
                let headers = document.getElementsByClassName("table-header");
                for (let i = 0; i < headers.length; i++){
                    if (this.headerScrollFunctionRefs[i]) {
                        headers[i].removeEventListener("scroll", this.headerScrollFunctionRefs[i]);
                    }
                    let headerScrollFunctionRef = this.headerScrolled.bind(this);
                    headers[i].addEventListener("scroll", headerScrollFunctionRef);
                    this.headerScrollFunctionRefs[i] = headerScrollFunctionRef;
                }
                this.tableData.nativeElement.removeEventListener("scroll", this.dataScrollFunctionRef);
                this.dataScrollFunctionRef = this.dataScrolled.bind(this);
                this.tableData.nativeElement.addEventListener("scroll", this.dataScrollFunctionRef);
                this.scrollbarWidth = this.scrollContainer.offsetWidth - this.scrollContainer.clientWidth;
            });
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        this.updateLines();
    }

    ngOnDestroy() {
        let headers = document.getElementsByClassName("table-header");
        for (let i = 0; i < headers.length; i++){
            if (this.headerScrollFunctionRefs[i]) {
                headers[i].removeEventListener("scroll", this.headerScrollFunctionRefs[i]);
            }
        }
        this.scrollContainer.removeEventListener("scroll", this.verticalScrollFunctionRef);
        this.destroyed = true;
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

    private updateLines(showTransition = true) {
        if (!this.primaryLine || !this.primaryLine.nativeElement) {
            clearTimeout(this.updateLineTimeout);
            this.updateLineTimeout = setTimeout(() => {
                this.updateLines();
            }, 50);
            return;
        }

        let styleStr = `left: ${(140 + 120 * this.selectedIndexes[0]) - this.scrollLeft}px;`;
        if (!showTransition) {
            styleStr += "transition: none;";
        }
        this.primaryLine.nativeElement.setAttribute("style", styleStr);
        if (this.indexCount >= 2) {
            let styleStr = `left: ${(140 + 120 * this.selectedIndexes[1]) - this.scrollLeft}px;`;
            if (!showTransition) {
                styleStr += "transition: none;";
            }
            this.secondaryLine.nativeElement.setAttribute("style", styleStr);
        } else {
            this.secondaryLine.nativeElement.setAttribute("style", "left: -100px; opacity: 0");
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
            headers[i].scrollLeft = this.scrollLeft;
        }
        this.tableData.nativeElement.scrollLeft = this.scrollLeft;
        this.updateLines(false);
    }

    dataScrolled(e: Event) {
        this.scrollLeft = this.tableData.nativeElement.scrollLeft;
        let headers = document.getElementsByClassName("table-header");
        for (var i = 0; i < headers.length; i++){
            headers[i].scrollLeft = this.scrollLeft;
        }
        this.updateLines(false);
    }

    updateTableRows() {
        this.tableRowList = [];
        this.tableRowMap = {};
        this.stats.forEach(stat => {
            stat.data.forEach(data => {
                var regionName = helpers.getRegionName(data);
                var tableRow = this.tableRowMap[regionName];
                if (!tableRow) {
                    tableRow = new TableRow(data.r, data.i);
                    this.tableRowMap[regionName] = tableRow;
                    this.tableRowList.push(tableRow);
                }
                tableRow.values.push(data.v);
            })
        });
    }
}
