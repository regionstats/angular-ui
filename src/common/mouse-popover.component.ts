import { Component, Input, SimpleChanges, ElementRef, ViewChild, NgZone } from '@angular/core';


@Component({
    selector: 'mouse-popover',
    templateUrl: './mouse-popover.component.html'
})
export class MousePopoverComponent {
    @ViewChild("popover") popover: ElementRef;

    constructor(private zone: NgZone) {
        //this.element = elementRef.nativeElement
    }

    ngOnInit() {
        this.zone.runOutsideAngular(() => {
            document.addEventListener("mousemove", (e: MouseEvent) =>{
                this.popover.nativeElement.setAttribute("style", `left: ${e.pageX + 10}px; top: ${e.pageY + 10}px;`)
            })
        })
    }

    ngOnChanges(changes: SimpleChanges) {

    }

    ngOnDestroy(){
    }

}