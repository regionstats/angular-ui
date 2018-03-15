

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
                    task.x = taskMapContainer.map[task.id].x
                    task.y = taskMapContainer.map[task.id].y;
                    delete taskMapContainer.map[task.id];
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
                let el = document.getElementById("rs-" + key);
                if (el) {
                    map[key].x += ((map[key].endX - map[key].x) * percent);
                    map[key].y += ((map[key].endY - map[key].y) * percent)
                    if (percent < 1) {
                        this.setCoordinate(el, map[key].type, map[key].x, map[key].y);
                    } else {
                        this.setCoordinate(el, map[key].type, map[key].endX, map[key].endY);
                    }
                }
            }
            container.prevTime = now;
            if (percent >= 1) {
                clearInterval(intervalId);
                this.taskMapContainers = this.taskMapContainers.filter(z => z != container);
            }
        }, intervalTime);
    }

    private setCoordinate(element: Element, type: CoordinateType, x: number, y: number) {
        switch (type) {
            case CoordinateType.circle:
                element.setAttribute("cx", x.toString());
                element.setAttribute("cy", y.toString());
                break;
            default:
                throw "not implemented";    
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
    type: CoordinateType;
    x: number;
    y: number;
    endX: number;
    endY: number;
}

export enum CoordinateType{
    circle,
    lineStart,
    lineEnd
}