import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { APIService } from '../services/api.service';
import { HashService } from '../services/hash.service';
import { Stat, AddStatRequest, Source } from '@regionstats/models';
import { validateStatAsync } from '@regionstats/validator';

@Component({
    selector: 'stat-form-component',
    templateUrl: './stat-form.component.html',
})
export class StatFormComponent {
    @Input() selectedStat: Stat | string;
    @Input() tab: string = "main";
    @Output() tabChange = new EventEmitter<string>();

    stat: Stat;
    hash: string;

    source: Source;

    ipfsName: string;
    ipfsTripcode: string;
    ipfsCategory: string;

    ipfsCategories = ["Demographics", "Crime", "Education", "Economics", "Opinion", "Voting", "Other"]
    publishError: string;

    constructor(private apiService: APIService, private hashService: HashService) {
    }

    ngOnInit() {
        this.source = new Source({});
    }

    ngOnChanges(changes: SimpleChanges){
        if (changes.selectedStat){
            if (typeof this.selectedStat == "object"){
                this.hash = null;
                this.setStat(this.selectedStat);
            } else {
                this.hash = this.selectedStat;
                this.hashService.get(this.selectedStat).subscribe(obj => {
                    this.setStat(obj);
                })
            }
        }
    }

    private setStat(stat: Stat){
        this.stat = stat;
        this.source = stat.source ? stat.source : new Source({});
        this.sourceChanged();
    }

    setTab(tab: string){
        if (tab != this.tab){
            this.tab = tab;
            this.tabChange.emit(tab);
        }
    }

    sourceChanged(){
        if (this.isValidString(this.source.title)
        || this.isValidString(this.source.publisher)
        || this.isValidString(this.source.url)
        || this.source.year != null){
            this.stat.source = this.source;
        } else {
            delete this.stat.source;
        }
    }

    private isValidString(prop: any): boolean{
        return prop && typeof prop == "string" && prop.trim().length > 0;
    }

    publishStat(){
        this.publishError = "";
        if (this.isValidString(this.ipfsTripcode) && this.ipfsTripcode.trim().length < 20){
            this.publishError = "Tripcode Key must be empty or longer than 20 characters"
            return;
        }
        validateStatAsync(this.selectedStat, this.hashService.get.bind(this.hashService)).subscribe(error => {
            if (error){
                this.publishError = "error with stat: " + error;
                return;
            }
            var request = <AddStatRequest>{
                name: this.ipfsName,
                tripcodeKey: this.ipfsTripcode,
                category: this.ipfsCategory,
                stat: this.selectedStat,
            }
            this.apiService.addStat(request).subscribe(result => {
                console.log("result", result);
            })
        })
    }
}

