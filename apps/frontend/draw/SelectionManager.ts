import { useCursorType } from "@/store/useMouseStore";
import { RenderingManager } from "./RenderingManager";
import { BaseShape } from "./shapes/BaseShape";
import { Shape } from "./types";
import { CollaborationManager } from "./CollaborationManager";
import throttle from "lodash.throttle";



interface SelectionState {
    selectedShape: BaseShape | null,
    selectedShapeWithBounds: BaseShape | null,
    isDraggin: boolean,
    dragStartX: number,
    dragStartY: number,
    isResizing: boolean,
    resizeHanle: any | null,
    previousState: Shape | null,
    originalBounds: { x: number, y: number, width: number, height: number } | null,
}


export class SelectionManager {
    private ctx: CanvasRenderingContext2D;
    private isHovering: boolean;
    private Handle_size: number;
    private hitTolerance: number;
    private renderingManager: RenderingManager;
    private selectionState: SelectionState = {
        selectedShape: null,
        selectedShapeWithBounds: null,
        isDraggin: false,
        dragStartX: 0,
        dragStartY: 0,
        isResizing: false,
        resizeHanle: null,
        previousState: null,
        originalBounds: null,
    }


    constructor(ctx: CanvasRenderingContext2D,
        Handle_size: number,
        hitTolerance: number,
        renderingManager: RenderingManager,
        private getExistingShapes: () => BaseShape[],
        private getTransform: () => { scale: number, panX: number, panY: number },
        private getExistingPaths: () => { [key: string]: Path2D },
        private getUpdatedMouseCoords: (x: number, y: number) => { x: number, y: number },
        private getMousePixelCoords: (x: number, y: number) => { pixelX: number, pixelY: number },
        private collaborationManager: CollaborationManager,


    ) {
        this.ctx = ctx;
        this.Handle_size = Handle_size;
        this.hitTolerance = hitTolerance;
        this.isHovering = false;
        this.renderingManager = renderingManager;
    }


    private throttledVersionUpdate = throttle((shape: BaseShape) => {
        shape.incrementVersion();
    }, 16);


    mouseHoverDetection = async (e: MouseEvent) => {

        const { x, y } = await this.getUpdatedMouseCoords(e.clientX, e.clientY);
        const { cursorType, setCursorType } = useCursorType.getState();

        const { pixelX, pixelY } = this.getMousePixelCoords(e.clientX, e.clientY);

        const selectedShape = this.selectionState.selectedShapeWithBounds;
        const existingPaths = this.getExistingPaths();


        if (selectedShape) {
            const handleType = this.checkIfHandleAtPoint(x, y);
            if (handleType !== null) {
                // console.log('pointing ot hanle ',handleType)
                let cursor = 'cursor-default';
                switch (handleType) {
                    case 'top-left':
                    case 'bottom-right':
                        cursor = "cursor-nw-resize"
                        break;
                    case 'top-right':
                    case 'bottom-left':
                        cursor = "cursor-ne-resize"
                        break;

                    default:
                        break;
                }
                if (cursorType !== cursor) {
                    setCursorType(cursor)
                }
                return;
            }
        }



        this.isHovering = false;
        this.ctx.save();
        const hitLineWidth = this.hitTolerance / this.getTransform().scale;
        this.ctx.lineWidth = hitLineWidth;
        Object.entries(existingPaths).forEach(([id, path]) => {
            if (this.ctx.isPointInStroke(path, pixelX, pixelY)) {
                this.isHovering = true;
                this.selectionState.selectedShape = this.getExistingShapes().find(shape => shape.getShapeId() === id) ?? null;
            }
        })
        this.ctx.restore();

        const nextCursor = this.isHovering ? 'cursor-move' : 'cursor-default';

        if (cursorType !== nextCursor) {
            setCursorType(nextCursor);
        }
    };

    checkIfHandleAtPoint = (x: number, y: number) => {
        const selectedShape = this.selectionState.selectedShape;
        const { scale } = this.getTransform();


        if (!selectedShape) return null;

        const handlesize = this.Handle_size / scale;
        const { bounds } = this.renderingManager.getBoundingBox(selectedShape);
        const handles = this.renderingManager.getResizeHandlers(bounds)
        for (let handle of handles)
            if (x >= handle.x && x <= handle.x + handlesize && y >= handle.y && y <= handle.y + handlesize) {
                return handle.type;
            }
        return null;

    }
    handleShapeDrag = async (e: MouseEvent) => {
        if (!this.selectionState.selectedShape) return;

        const { x, y } = await this.getUpdatedMouseCoords(e.clientX, e.clientY);
        const dx = x - this.selectionState.dragStartX;
        const dy = y - this.selectionState.dragStartY;

        this.selectionState.selectedShape?.drag(dx, dy)

        this.selectionState.dragStartX = x
        this.selectionState.dragStartY = y

        if (this.selectionState.selectedShape) {
            this.throttledVersionUpdate(this.selectionState.selectedShape);
            this.collaborationManager.sendShapePreview(this.selectionState.selectedShape.serialize(), 'modification');

        }
        this.renderingManager.scheduleClearCanvas();


    }

    handleShapeResize = (e: MouseEvent) => {
        const selectedState = this.selectionState;
        if (!selectedState.selectedShape || !selectedState.originalBounds) return;

        const { x, y } = this.getUpdatedMouseCoords(e.clientX, e.clientY);
        const dx = x - selectedState.dragStartX;
        const dy = y - selectedState.dragStartY;

        const origBounds = selectedState.originalBounds;

        switch (selectedState.resizeHanle) {
            case 'top-left':
                selectedState.selectedShape?.resize(origBounds.x + dx, origBounds.y + dy, origBounds.width - dx, origBounds.height - dy)
                break;
            case 'top-right':
                selectedState.selectedShape?.resize(origBounds.x, origBounds.y + dy, origBounds.width + dx, origBounds.height - dy)
                break
            case 'bottom-left':
                selectedState.selectedShape?.resize(origBounds.x + dx, origBounds.y, origBounds.width - dx, origBounds.height + dy)
                break;
            case 'bottom-right':
                selectedState.selectedShape?.resize(origBounds.x, origBounds.y, origBounds.width + dx, origBounds.height + dy)
                break;
        }

        if (selectedState.selectedShape) {
            this.throttledVersionUpdate(selectedState.selectedShape);
            this.collaborationManager.sendShapePreview(selectedState.selectedShape.serialize(), 'modification');
        }

        this.renderingManager.scheduleClearCanvas();


    }

    handleShapeSelectionMouseDown = (e: MouseEvent) => {
        const { x, y } = this.getUpdatedMouseCoords(e.clientX, e.clientY)
        const { pixelX, pixelY } = this.getMousePixelCoords(e.clientX, e.clientY);
        const resizeHandle = this.checkIfHandleAtPoint(x, y);
        if (this.selectionState.selectedShape && resizeHandle !== null) {
            this.selectionState.isResizing = true;
            this.selectionState.resizeHanle = resizeHandle;
            this.selectionState.dragStartX = x;
            this.selectionState.dragStartY = y;
            this.selectionState.originalBounds = this.selectionState.selectedShape.getBounds();
            this.selectionState.previousState = this.selectionState.selectedShape.serialize();
            console.log('inside the handleShapeSelectionMouseDown')
        } else if (this.selectionState.selectedShape && this.ctx.isPointInPath(this.renderingManager.getBoundingBox(this.selectionState?.selectedShape).path, pixelX, pixelY)) {
            console.log('is inside the bounding box')
            this.selectionState.isDraggin = true;
            this.selectionState.dragStartX = x;
            this.selectionState.dragStartY = y;
            this.selectionState.previousState = this.selectionState.selectedShape.serialize(); //state before modificatoin

        } else {
            console.log('is outside the bounding box')
            this.selectionState.selectedShape = null;
            this.selectionState.selectedShapeWithBounds = null;
            this.selectionState.isDraggin = false;
            this.selectionState.resizeHanle = null;
            this.selectionState.dragStartX = 0;
            this.selectionState.dragStartY = 0;

            this.renderingManager.scheduleClearCanvas();

        }

        if (this.isHovering && this.selectionState.selectedShape) {

            this.selectionState.selectedShapeWithBounds = this.selectionState.selectedShape;
            this.renderingManager.drawBoundingBox(this.selectionState.selectedShape)

        }
    }


    getSelectionState = () => {
        return this.selectionState;
    }
    getSelectedShape = () => {
        return this.selectionState.selectedShape || this.selectionState.selectedShapeWithBounds;
    }

    getSelectedShapeWithBounds = () => {
        return this.selectionState.selectedShapeWithBounds;
    }

    setSelectedShape = (shape: BaseShape | null) => {
        this.selectionState.selectedShape = shape;
    }

    setSelectedShapeWithBounds = (shape: BaseShape | null) => {
        this.selectionState.selectedShapeWithBounds = shape;
    }

    isResizing() {
        return this.selectionState.isResizing;
    }

    isDragging() {
        return this.selectionState.isDraggin;
    }


    resetDragResizeState() {
        this.selectionState.isDraggin = false;
        this.selectionState.isResizing = false;
        this.selectionState.resizeHanle = null;
        this.selectionState.previousState = null;

    }
    getPreviousState() {
        return this.selectionState.previousState;
    }



}