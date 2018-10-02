import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { APIService } from '../services/api.service';
import { HashService } from '../services/hash.service';
import { Stat, AddStatRequest, Source } from '@regionstats/models';
import { validateStatAsync } from '@regionstats/validator';
import { StatContainer } from '../models/stat-container';

@Component({
    selector: 'stat-form-component',
    templateUrl: './stat-form.component.html',
})
export class StatFormComponent {
    @Input() selectedStatContainer: StatContainer;
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
        this.source = new Source();
    }

    ngOnChanges(changes: SimpleChanges){
        if (changes.selectedStatContainer){
            this.stat = this.selectedStatContainer.stat;
            this.hash = this.selectedStatContainer.hash;
            this.source = this.stat.source ? this.stat.source : new Source();
            this.sourceChanged();
        }
    }

    setTab(tab: string){
        if (tab != this.tab){
            this.tab = tab;
            this.tabChange.emit(tab);
        }
    }

    setHash(hash: string){
        this.hash = hash;
        this.selectedStatContainer.hash = hash;
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
        validateStatAsync(this.selectedStatContainer.stat, this.hashService.get.bind(this.hashService)).subscribe(error => {
            if (error){
                this.publishError = "error with stat: " + error;
                return;
            }
            var request = <AddStatRequest>{
                name: this.ipfsName,
                tripcodeKey: this.ipfsTripcode,
                category: this.ipfsCategory,
                stat: this.selectedStatContainer.stat,
            }
            this.apiService.addStat(request).subscribe(result => {
                this.setHash(result);
            }, err => {
                this.publishError = "server error attempting to publish stat";
            })
        });
    }

    unpublish(){
        this.setHash(null);
    }
}

