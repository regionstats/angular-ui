

import { Injectable } from '@angular/core';

@Injectable()
export class AnimateService {
   
    private taskMapContainers: TaskMapContainer[] = [];

    constructor() { }

    startTasks(tasks: Task[], duration: number, intervalTime = 5) {
        let expected = duration / intervalTime;
        let count = 0;
        let container = new TaskMapContainer();
        container.map = {};
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
        let intervalId = setInterval(() => {
            count++
            let now = Date.now();
            let percent = (now - container.prevTime) / (container.endTime - container.prevTime);
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
            container.prevTime = now;
            if (percent >= 1) {
                clearInterval(intervalId);
                this.taskMapContainers = this.taskMapContainers.filter(z => z != container);
            }
        }, intervalTime);
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