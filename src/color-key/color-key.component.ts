import { Component, Input, SimpleChanges } from '@angular/core';
import { Color } from '../models/color';
import { DataService } from '../services/data.service';
import { Subscription, combineLatest } from 'rxjs';
import { Stat, Data } from '@regionstats/models';
import { StatContainer } from '../models/stat-container';

@Component({
    selector: 'color-key',
    templateUrl: './color-key.component.html'
})
export class ColorKeyComponent {
    @Input() minColor: Color;
    @Input() midColor: Color;
    @Input() maxColor: Color;
    @Input() selectedData: Data;

    background: string;
    selectionLeft: string;

    private statSubscription: Subscription
    private statContainer: StatContainer;

    constructor(private dateService: DataService) {
        this.minColor = new Color(255, 255, 255);
        this.midColor = new Color(0, 99, 255);
        this.maxColor = new Color(0, 16, 35);
    }

    ngOnInit() {
        this.background = `linear-gradient(135deg, ${this.minColor},${this.midColor},${this.maxColor})`;

        this.statSubscription = combineLatest(this.dateService.getStats(), this.dateService.getSelectedIndexes()).subscribe(arr => {
            let stats = arr[0];
            let indexes = arr[1];
            this.statContainer = stats[indexes[0]];
            this.setSelectedPosition();
        })

    }

    ngOnChanges(changes: SimpleChanges) {
        if(changes.selectedData){
            this.setSelectedPosition();
        }
    }

    ngOnDestroy(){
        this.statSubscription && this.statSubscription.unsubscribe();
    }

    setSelectedPosition(){
        if(!this.selectedData || !this.statContainer){
            return;
        }
        let calc = this.statContainer.calc;
        let z = (this.selectedData.v - calc.mean) / calc.sd;
        this.selectionLeft = ((100 * (z+2)/4)).toFixed(3);
    }
}
