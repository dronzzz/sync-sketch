

import { CollaborationManager } from "./CollaborationManager";
import { RenderingManager } from "./RenderingManager";
import { Arrow } from "./shapes/Arrow";
import { BaseShape } from "./shapes/BaseShape";
import { Diamond } from "./shapes/Diamond";
import { Ellipse } from "./shapes/Ellipse";
import { Line } from "./shapes/Line";
import { Pencil } from "./shapes/Pencil";
import { Rect } from "./shapes/Rect";
import { Shape } from "./types";

export class DrawingManager {
    private ctx: CanvasRenderingContext2D;
    private startX: number = 0;
    private startY: number = 0;

    constructor(
        ctx: CanvasRenderingContext2D,
        private getSelectedColor: () => string,
        private getStrokeWidth: () => number,
        private getSelectedTool: () => string,
        private renderingManager: RenderingManager,
        private collaborationManager: CollaborationManager,
        private getUpdatedMouseCoords: (x: number, y: number) => { x: number; y: number },
        private getExistingShapes: () => BaseShape[],


    ) {
        this.ctx = ctx;


    }

    setStartPosition(x: number, y: number) {
        this.startX = x;
        this.startY = y;
    }



    handleDrawingOnMouseMove = (e: MouseEvent) => {
        const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY)
        let previewShape: Shape | null = null;
        const selectedColor = this.getSelectedColor();
        const strokeWidth = this.getStrokeWidth();

        switch (this.getSelectedTool()) {
            case "rect":
                const rectHeight = canvasCoords.y - this.startY;
                const rectWidth = canvasCoords.x - this.startX;

                previewShape = {
                    type: 'rect',
                    x: this.startX,
                    y: this.startY,
                    width: rectWidth,
                    height: rectHeight,
                    color: selectedColor,
                    lineWidth: strokeWidth,
                };
                break;

            case "ellipse":
                const width = canvasCoords.x - this.startX;
                const height = canvasCoords.y - this.startY;
                previewShape = {
                    type: 'ellipse',
                    centerX: this.startX + width / 2,
                    centerY: this.startY + height / 2,
                    radiusX: Math.abs(width / 2),
                    radiusY: Math.abs(height / 2),
                    color: selectedColor,
                    lineWidth: strokeWidth
                };
                break;

            case "line":
                previewShape = {
                    type: 'line',
                    startX: this.startX,
                    startY: this.startY,
                    endX: canvasCoords.x,
                    endY: canvasCoords.y,
                    color: selectedColor,
                    lineWidth: strokeWidth
                };
                break;

            case "pencil":
                const existingShapes = this.getExistingShapes();
                const currentShape = existingShapes[existingShapes.length - 1];
                if (currentShape instanceof Pencil) {
                    currentShape.addPoint(canvasCoords.x, canvasCoords.y);
                    this.renderingManager.scheduleClearCanvas();
                    currentShape.draw(this.ctx);
                    this.collaborationManager.sendShapePreview(currentShape.serialize(), 'new');
                }
                break;

            case "diamond":
                const diamondWidth = canvasCoords.x - this.startX;
                const diamondHeight = canvasCoords.y - this.startY;
                previewShape = {
                    type: 'diamond',
                    centerX: this.startX + diamondWidth / 2,
                    centerY: this.startY + diamondHeight / 2,
                    radiusX: Math.abs(diamondWidth / 2),
                    radiusY: Math.abs(diamondHeight / 2),
                    color: selectedColor,
                    lineWidth: strokeWidth
                };
                break;

            case "arrow":
                previewShape = {
                    type: 'arrow',
                    startX: this.startX,
                    startY: this.startY,
                    endX: canvasCoords.x,
                    endY: canvasCoords.y,
                    color: selectedColor,
                    lineWidth: strokeWidth
                };
                break;


        }

        if (previewShape) {
            this.renderingManager.scheduleClearCanvas();
            requestAnimationFrame(() => {
                this.renderingManager.drawAllShapes(previewShape);
            });
            this.collaborationManager.sendShapePreview(previewShape, 'new');

        }
    }

    createShape(e: MouseEvent): BaseShape | null {
        const selectedColor = this.getSelectedColor();
        const strokeWidth = this.getStrokeWidth();
        const canvasCoords = this.getUpdatedMouseCoords(e.clientX, e.clientY);
        let inputShape: BaseShape | null = null;

        switch (this.getSelectedTool()) {

            case "rect":
                inputShape = new Rect(
                    this.startX,
                    this.startY,
                    canvasCoords.x - this.startX,
                    canvasCoords.y - this.startY,
                    selectedColor,
                    strokeWidth
                );
                break;

            case "ellipse":
                const width = canvasCoords.x - this.startX;
                const height = canvasCoords.y - this.startY;
                inputShape = new Ellipse(
                    this.startX + width / 2,
                    this.startY + height / 2,
                    Math.abs(width / 2),
                    Math.abs(height / 2),
                    selectedColor,
                    strokeWidth
                );
                break;


            case "line":
                inputShape = new Line(
                    this.startX,
                    this.startY,
                    canvasCoords.x,
                    canvasCoords.y,
                    selectedColor,
                    strokeWidth
                );
                break;



            case "pencil":
                const existingShapes = this.getExistingShapes();
                inputShape = existingShapes[existingShapes.length - 1]  //last shape as Shape
                break;

            case "diamond":
                const widthh = canvasCoords.x - this.startX
                const heighth = canvasCoords.y - this.startY
                inputShape = new Diamond(
                    this.startX + widthh / 2,
                    this.startY + heighth / 2,
                    Math.abs(widthh / 2),
                    Math.abs(heighth / 2),
                    selectedColor,
                    strokeWidth


                )
                break;

            case "arrow":
                inputShape = new Arrow(
                    this.startX,
                    this.startY,
                    canvasCoords.x,
                    canvasCoords.y,
                    selectedColor,
                    strokeWidth
                );
                break;

        }

        return inputShape;
    }


}