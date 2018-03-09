import { Component, Input, SimpleChange, SimpleChanges } from '@angular/core';
import * as Pako from 'pako';

@Component({
    selector: 'converter-component',
    templateUrl: './converter.component.html',
})
export class ConverterComponent {
    public json: string;
    public url: string;
    constructor() {
    }

    ngOnInit() {
        
    }
    jsonChanged() {
        try {
            var obj = JSON.parse(this.json)
        } catch (e) {
            console.log("FAILED TO PARSE");
        }
        this.url = encodeURIComponent(btoa(Pako.deflate(JSON.stringify(obj), { to: 'string' })));
    }
}
