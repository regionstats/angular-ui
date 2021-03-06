

import { Injectable, NgZone } from '@angular/core';

@Injectable()
export class AnimateService {
   
    private taskMapContainers: TaskMapContainer[] = [];

    constructor(private zone: NgZone) { }

    startTasks(tasks: Task[], duration: number, callback?: () => any) {
        this.zone.runOutsideAngular(() => {
            this._startTasks(tasks, duration, callback);
        })
    }

    private _startTasks(tasks: Task[], duration: number, callback?: () => any){
        let container = new TaskMapContainer();
        container.map = {};
        /*
        When the new tasks animate an attribute already getting animated, there's 2 things I could do:
        1. I could set the new TA's starting position to the old TA's current position, and delete the old TA
        2. I could set the old TA's ending position to the new TA's ending position, and delete the new TA
        The options differ in whether the TA has the endTime of the old task, or the new task.
        I went with option 1, since option 2 might cause animations much faster than I want
        */
        tasks.forEach(task => {
            this.taskMapContainers.forEach(taskMapContainer => {
                if (taskMapContainer.map[task.id]) {
                    task.attributes.forEach(attr => {
                        let index = taskMapContainer.map[task.id].attributes.findIndex(z => z.name == attr.name);
                        if (index >= 0) {
                            attr.val = taskMapContainer.map[task.id].attributes[index].val;
                            taskMapContainer.map[task.id].attributes.splice(index, 1);
                        }
                    });
                }
            });
            container.map[task.id] = task;
        });
        this.taskMapContainers.push(container);
        container.prevTime = Date.now();
        container.endTime = container.prevTime + duration;
        let map = container.map;
        var renderFrameRef = renderFrame.bind(this);
        requestAnimationFrame(renderFrameRef);
        var test = performance.now;
        function renderFrame(){
            let now = Date.now();
            if (now - container.prevTime < 10){
                requestAnimationFrame(renderFrameRef);
                return;
            }
            let percent = (now - container.prevTime) / (container.endTime - container.prevTime);
            container.prevTime = now;
            for (let key in map) {
                let el = document.getElementById(key);
                if (el) {
                    map[key].attributes.forEach(attr => {
                        attr.val += (attr.endVal - attr.val) * percent;

                        if (percent < 1) {
                            el.setAttribute(attr.name, attr.val.toString());
                        } else {
                            el.setAttribute(attr.name, attr.endVal.toString());
                        }
                    })
                }
            }
            if (percent >= 1) {
                this.taskMapContainers = this.taskMapContainers.filter(z => z != container);
                if (typeof callback == "function") {
                    callback();
                }
            } else {
                requestAnimationFrame(renderFrameRef);
            }
        }
    }
}

class TaskMapContainer{
    prevTime: number;
    endTime: number;
    map: { [id: string]: Task }
}

export class Task {
    id: string;
    attributes: TaskAttribute[]
    constructor(id: string) {
        this.id = id;
        this.attributes = [];
    }
}

export class TaskAttribute{
    name: string;
    val: number;
    endVal: number;
    constructor(name: string, val: number, endVal: number) {
        this.name = name;
        this.val = val;
        this.endVal = endVal;
    }
}