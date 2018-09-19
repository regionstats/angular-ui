import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ParserService } from '../services/parser.service'
import { HashService } from '../services/hash.service'
import { Data } from '../models/data';
import readXlsxFile from 'read-excel-file';
import { BlockRenderComponent } from '../common/block-render.component';
import { Observable } from 'rxjs';
import { validatePageAsync } from '@regionstats/validator';

import { Stat, AddStatRequest } from '@regionstats/models';

@Component({
    selector: 'stat-form-component',
    templateUrl: './stat-form.component.html',
})
export class StatFormComponent {
    @Input() selectedStat: Stat
    @Input() tab: string = "main";
    @Output() tabChange = new EventEmitter<string>();

    constructor(private hashService: HashService) {
    }

    ngOnInit() {
    }

    setTab(tab: string){
        if (tab != this.tab){
            this.tab = tab;
            this.tabChange.emit(tab);
        }
    }

    addStatToIPFS(){
        var request = <AddStatRequest>{
            stat: this.selectedStat
        }
        this.hashService.addStat(request);
    }
}

