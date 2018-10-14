import { Component, Input, SimpleChanges, ElementRef, ViewChild, NgZone } from '@angular/core';


@Component({
    selector: 'mouse-popover',
    templateUrl: './mouse-popover.component.html'
})
export class MousePopoverComponent {
    @ViewChild("popover") popover: ElementRef;
    mousemoveFunctionRef: (e) => {};
    popoverElement: HTMLElement;

    constructor(private zone: NgZone) {
    }

    ngOnInit() {
        this.popoverElement = this.popover.nativeElement;
        this.mousemoveFunctionRef = this.mousemove.bind(this);
        this.zone.runOutsideAngular(() => {
            document.addEventListener("mousemove", this.mousemoveFunctionRef);
        })
    }

    
    ngOnDestroy(){
        document.removeEventListener("mousemove", this.mousemoveFunctionRef);
    }

    private mousemove(e: MouseEvent){
        var targetLeft = e.pageX + 10;
        var elementWidth = this.popoverElement.offsetWidth;
        if (window.innerWidth < targetLeft + elementWidth){
            this.popoverElement.setAttribute("style", `right: ${0}px; top: ${e.pageY + 10}px;`)
        } else {
            this.popoverElement.setAttribute("style", `left: ${targetLeft}px; top: ${e.pageY + 10}px;`)
        }

    }

    ngOnChanges(changes: SimpleChanges) {

    }

}