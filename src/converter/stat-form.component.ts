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
    @Input() selectedStat: Stat
    @Input() tab: string = "main";
    @Output() tabChange = new EventEmitter<string>();

    source: Source;

    ipfsName: string;
    ipfsTripcode: string;
    ipfsCategory: string;

    ipfsCategories = ["Census", "Crime", "Education", "Economics", "Opinion", "Voting", "Other"]
    publishError: string;

    constructor(private apiService: APIService, private hashService: HashService) {
    }

    ngOnInit() {
        this.source = new Source({});
    }

    ngOnChanges(changes: SimpleChanges){
        if (changes.selectedStat){
            this.source = this.selectedStat.source ? this.selectedStat.source : new Source({});
            this.sourceChanged();
        }
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
            this.selectedStat.source = this.source;
        } else {
            delete this.selectedStat.source;
        }
    }

    private isValidString(prop: any): boolean{
        return prop && typeof prop == "string" && prop.trim().length > 0;
    }

    publishStat(){
        console.log(this.ipfsTripcode)
        this.publishError = "";
        if (this.isValidString(this.ipfsTripcode) && this.ipfsTripcode.trim().length < 20){
            this.publishError = "Tripcode Key must be empty or longer than 20 characters. Unlike traditional passwords, the hash of the tripcode key is unsalted AND publicized."
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
            }, err => {
                this.publishError = error;
            })
        })
    }
}

