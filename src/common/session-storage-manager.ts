import { AnyObject } from "../models/any-object";

export class SessionStorageManager {
    private namespace: string;
    private data: AnyObject;

    constructor(namespace: string, defaults: AnyObject) {
        this.namespace = namespace;
        let objString = sessionStorage[this.namespace];
        this.data = objString ? JSON.parse(objString) : {};
        if (typeof defaults == "object") {
            for (var key in defaults) {
                if (this.data[key] === undefined) {
                    this.data[key] = defaults[key];
                }
            }
        }
    }

    getValue(key: string): any {
        return this.data[key];
    }

    setValue(key: string, value: any) {
        if (this.data[key] != value){
            this.data[key] = value;
            sessionStorage[this.namespace] = JSON.stringify(this.data);
        }
    }
}