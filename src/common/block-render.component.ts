import { Input, ContentChild, TemplateRef, ElementRef, SimpleChanges, ChangeDetectorRef, Component, NgZone } from "@angular/core";

@Component({
    selector: '[block-render]',
    templateUrl: './block-render.component.html'
})
export class BlockRenderComponent<T>{
    @Input() items: Array<T> = [];
    @Input() itemsPerBlock: number = 10;
    @Input() itemHeight: number = 50;
    @Input() forwardPreloadCount: number = 2;
    @Input() backwardPreloadCount: number = 1;

    @ContentChild('itemTemplate') itemTemplateRef: TemplateRef<any>;

    blockHeight: number;
    blocks: Array<{ render: boolean, indexes: number[] }> = [];
    private scrollTop: number;
    private elementOffsetTop: number;
    private viewportHeight: number;
    private scrollingDown: boolean = true;
    private initialized: boolean = false;
    private detectChangeTimeout: any;
    private ScrollFunctionRef: (e) => {};
    private scrollContainer: HTMLElement;

    constructor(
        private elementRef: ElementRef,
        private changeDetector: ChangeDetectorRef,
        private zone: NgZone
    ) {
    }

    ngOnInit() {
        this.blockHeight = this.itemsPerBlock * this.itemHeight;

        this.ScrollFunctionRef = this.scrollTopChanged.bind(this);
        this.scrollContainer = document.getElementById("scroll-container");
        this.zone.runOutsideAngular(() => {
            this.scrollContainer.addEventListener("scroll", this.ScrollFunctionRef);
        });

        this.updateBlocksIndexes();
        this.updateBlocksVisibility();
        this.initialized = true;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.itemHeight || changes.blockSize) {
            this.blockHeight = this.itemsPerBlock * this.itemHeight;
        }
        if (this.initialized) {
            this.updateBlocksIndexes();
            this.updateBlocksVisibility();
        }
    }

    private updateBlocksIndexes() {
        if (!Array.isArray(this.items)) {
            return;
        }
        let blockIndexCount = this.blocks.reduce((count, block) => {
            return count + block.indexes.length
        }, 0)
        if (blockIndexCount < this.items.length) {
            for (var i = blockIndexCount; i < this.items.length; i++) {
                let mod = Math.floor(i % this.itemsPerBlock);
                let div = Math.floor(i / this.itemsPerBlock);
                if (mod == 0) {
                    this.blocks.push({ render: false, indexes: [] });
                }
                this.blocks[div].indexes.push(i);
            }
        } else if (blockIndexCount > this.items.length) {
            for (var i = blockIndexCount - 1; i >= this.items.length; i--) {
                let mod = Math.floor(i % this.itemsPerBlock);
                let div = Math.floor(i / this.itemsPerBlock);
                if (mod == 0) {
                    this.blocks.splice(div, 1);
                } else {
                    this.blocks[div].indexes.splice(mod, 1);
                }
            }
        }
    }
    
    private scrollTopChanged(e: Event) {
        if (this.scrollContainer.scrollTop != this.scrollTop) {
            this.scrollingDown = (this.scrollContainer.scrollTop - this.scrollTop) > 0;
            this.updateBlocksVisibility();
        }
    }

    private isBlockVisible(index: number): boolean {
        let preloadCount = (this.scrollingDown) ? this.backwardPreloadCount : this.forwardPreloadCount;
        if ((index + preloadCount + 1) * this.blockHeight < this.scrollTop - this.elementOffsetTop) {
            return false; //block is above viewport
        }
        preloadCount = (this.scrollingDown) ? this.forwardPreloadCount : this.backwardPreloadCount;
        if ((index - preloadCount) * this.blockHeight > this.scrollTop + this.viewportHeight - this.elementOffsetTop) {
            return false; //block is below viewport
        }
        return true;
    }
    private updateBlocksVisibility() {
        this.viewportHeight = this.scrollContainer.clientHeight;
        this.scrollTop = this.scrollContainer.scrollTop;
        this.elementOffsetTop = this.elementRef.nativeElement.offsetTop;
        let hasChanges = false;
        this.blocks.forEach((block, i) => {
            let result = this.isBlockVisible(i);
            if (block.render != result) {
                hasChanges = true;
                block.render = result;
            }
        });
        // change detection cycles cause the scroll area to freeze, so we don't want to call them too often.
        if (hasChanges) {
            if (this.detectChangeTimeout) {
                clearTimeout(this.detectChangeTimeout)
            }
            this.detectChangeTimeout = setTimeout(() => {
                this.changeDetector.detectChanges();
                this.detectChangeTimeout = null;
            }, 50)
        }
    }

}