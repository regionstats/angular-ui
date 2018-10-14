

import { Injectable, NgZone, ChangeDetectorRef } from '@angular/core';

@Injectable()
export class ThrottleService {
    previousTimes: {[name: string]: number} = {};
    timeoutIds: {[name: string]: any} = {};
    timeoutEndTimes: {[name: string]: number} = {};

    throttle(name: string, callback: () => any, timeGap: number){
        var previousTime = this.previousTimes[name];
        var currentTime = Date.now();
        if (previousTime == null || currentTime - previousTime > timeGap){
            this.previousTimes[name] = currentTime;
            clearTimeout(this.timeoutIds[name]);
            this.timeoutEndTimes[name] = null;
            callback();
        } else {
            var timeoutEndTime = this.timeoutEndTimes[name];
            var targetEndTime = previousTime + timeGap
            if (!timeoutEndTime || targetEndTime < timeoutEndTime){
                clearTimeout(this.timeoutIds[name]);
                var timeoutId = setTimeout(() => {
                    this.previousTimes[name] = Date.now();
                    callback();
                },  timeGap - (currentTime - previousTime));
                this.timeoutIds[name] = timeoutId;
                this.timeoutEndTimes[name] = previousTime + timeGap;
            }
        }
    }
}
