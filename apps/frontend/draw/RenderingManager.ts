import { ShapeRenderer } from "./shapeRenderer";
import { BaseShape } from "./shapes/BaseShape";
import { Shape } from "./types";

export class RenderingManager {
    private ctx: CanvasRenderingContext2D;
    private shapeRenderer: ShapeRenderer;
    private Handle_size: number;
    private needsRender = false;
    private previewShape: Shape | null = null;

    constructor(ctx: CanvasRenderingContext2D, Handle_size: number,
        private getStrokeWidth: () => number,
        private getTheme: () => string,
        private getTransform: () => { scale: number, panX: number, panY: number },
        private getExistingShapes: () => BaseShape[],
        private getExistingPaths: () => { [key: string]: Path2D },
        private getSelectedShape: () => BaseShape | null,
        private getCanvasSize: () => { canvasWidth: number, canvasHeight: number },
        private getEditingTextId: () => string | null,
        private getShapesToDelete: () => Set<string> = () => new Set(),
    ) {
        this.ctx = ctx;
        this.shapeRenderer = new ShapeRenderer(this.ctx);
        this.Handle_size = Handle_size;
    }


    drawAllShapes = (shape: Shape) => {
        const adaptedColor = this.themeBasedColorAdapter(shape.color);

        const adaptedShape = { ...shape, color: adaptedColor };

        switch (adaptedShape.type) {
            case 'rect':
                this.shapeRenderer.drawRect(adaptedShape);
                break;

            case 'ellipse':
                this.shapeRenderer.drawEllipse(adaptedShape);
                break;

            case 'line':
                this.shapeRenderer.drawLine(adaptedShape);
                break;

            case 'pencil':
                this.shapeRenderer.drawPencil(adaptedShape);
                break;

            case 'diamond':
                this.shapeRenderer.drawDiamond(adaptedShape);
                break;
            case 'arrow':
                this.shapeRenderer.drawArrow(adaptedShape);
                break;
            case 'text':
                this.shapeRenderer.drawText(adaptedShape);
                break;
            default:
                break;
        }
    }

    private themeBasedColorAdapter = (color: string): string => {
        const currentTheme = this.getTheme()
        if (currentTheme === "#ffffff" && color === "#d3d3d3")
            return "#1f1f1f"
        if (currentTheme === "#0d0c09" && color === "#1f1f1f")
            return "#d3d3d3"

        return color;
    }
    updateShapePath = (unSerializedShape: BaseShape) => {
        const shape = unSerializedShape.serialize()
        const path = new Path2D;


        switch (shape.type) {
            case 'rect':
                path.rect(shape.x, shape.y, shape.width, shape.height);

                break;

            case 'ellipse':
                path.ellipse(shape.centerX, shape.centerY, shape.radiusX, shape.radiusY, 0, 0, Math.PI * 2);
                break;

            case 'line':
                path.moveTo(shape.startX, shape.startY);
                path.lineTo(shape.endX, shape.endY);
                break;

            case 'pencil':
                if (shape.points && shape.points.length > 0) {
                    if (shape.points.length === 1) {//creating a square insted as a singel dot cannot have a path 
                        const pt = shape.points[0];
                        path.rect(pt.x - 5, pt.y - 5, 10, 10);
                    } else {
                        path.moveTo(shape.points[0].x, shape.points[0].y);
                        for (let i = 1; i < shape.points.length; i++) {
                            path.lineTo(shape.points[i].x, shape.points[i].y);
                        }
                    }
                }
                break;
            case 'diamond':
                path.moveTo(shape.centerX, shape.centerY - shape.radiusY);
                path.lineTo(shape.centerX + shape.radiusX, shape.centerY);
                path.lineTo(shape.centerX, shape.centerY + shape.radiusY);
                path.lineTo(shape.centerX - shape.radiusX, shape.centerY);
                path.closePath();
                break;

            case 'arrow':
                path.moveTo(shape.startX, shape.startY);
                path.lineTo(shape.endX, shape.endY);
                break;
            case 'text':
                const bounds = unSerializedShape.getBounds();
                path.rect(bounds.x, bounds.y, bounds.width, bounds.height);
                break;
            default:
                break;
        }
        if (shape.id) {
            const existingPaths = this.getExistingPaths();
            existingPaths[shape.id] = path;

        }


    }


    scheduleClearCanvas() {
        if (!this.needsRender) {
            this.needsRender = true;
            requestAnimationFrame(() => {
                this.clearCanvas();
                this.needsRender = false;
            });
        }
    }

    clearCanvas() {
        const { scale, panX, panY } = this.getTransform();
        const currentTheme = this.getTheme();
        const strokeWidth = this.getStrokeWidth();
        const { canvasWidth, canvasHeight } = this.getCanvasSize();
        this.ctx.setTransform(scale, 0, 0, scale, panX, panY);
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        this.ctx.fillStyle = currentTheme;
        this.ctx.fillRect(-panX / scale, -panY / scale, canvasWidth / scale, canvasHeight / scale);

        this.ctx.lineWidth = strokeWidth / scale;


        const selectedShape = this.getSelectedShape();
        if (selectedShape) {
            this.drawBoundingBox(selectedShape)
        }
        const shapesToDelete = this.getShapesToDelete();
        this.getExistingShapes().forEach((shape) => {
            if (shape.getIsDeleted()) {
                const existingPaths = this.getExistingPaths();
                delete existingPaths[shape.getShapeId()];
                return;
            }

            const editingTextId = this.getEditingTextId();
            if (editingTextId && shape.getShapeId() === editingTextId) {
                return;
            }

            const originalColor = shape.getColor();
            const adaptedColor = shapesToDelete.has(shape.getShapeId())
                ? "#b0adadff"
                : this.themeBasedColorAdapter(originalColor);

            shape.setColor(adaptedColor);
            shape.draw(this.ctx);
            this.updateShapePath(shape);
            shape.setColor(originalColor);
        });

        if (this.previewShape) {
            this.drawAllShapes(this.previewShape);
        }

    }

    drawBoundingBox = (shape: any) => {
        const currentTheme = this.getTheme();
        const { scale } = this.getTransform();
        const handleSize = this.Handle_size / scale
        this.ctx.save()
        const { path, bounds } = this.getBoundingBox(shape);
        this.ctx.lineWidth = 1 / scale;
        this.ctx.strokeStyle = currentTheme === '#0d0c09' ? '#b2aeff' : '#3029e6ff';

        this.ctx.stroke(path);

        this.ctx.restore();

        this.ctx.save();
        if (currentTheme === "#0d0c09") {

            this.ctx.fillStyle = '#0d0c09';
        } else {
            this.ctx.fillStyle = '#ffffff';

        }
        this.ctx.lineWidth = 1 / scale;
        this.ctx.strokeStyle = currentTheme === '#0d0c09' ? '#b2aeff' : '#3029e6ff';



        const handlers = this.getResizeHandlers(bounds)
        handlers.forEach(handle => {
            this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);

        })

        this.ctx.restore();

    }

    setPreviewShape(shape: Shape | null) {
        this.previewShape = shape;
    }

    getBoundingBox = (shape: BaseShape) => {
        const { x, y, width, height } = shape.getBounds();
        const gap = 10;

        const normalizedX = width < 0 ? x + width : x;
        const normalizedY = height < 0 ? y + height : y;
        const normalizedWidth = Math.abs(width);
        const normalizedHeight = Math.abs(height);

        const path = new Path2D();
        path.rect(
            normalizedX - gap,
            normalizedY - gap,
            normalizedWidth + gap * 2,
            normalizedHeight + gap * 2
        );

        return {
            path,
            bounds: {
                x: normalizedX - gap,
                y: normalizedY - gap,
                width: normalizedWidth + gap * 2,
                height: normalizedHeight + gap * 2
            }
        };
    }

    getResizeHandlers = (bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => {
        const { scale } = this.getTransform();

        const handleSize = this.Handle_size / scale;
        const halfHandle = handleSize / 2

        const handles = [
            {
                type: "top-left",
                x: bounds.x - halfHandle,
                y: bounds.y - halfHandle,
            },
            {
                type: "top-right",
                x: bounds.x + bounds.width - halfHandle,
                y: bounds.y - halfHandle,
            },
            {
                type: "bottom-left",
                x: bounds.x - halfHandle,
                y: bounds.y + bounds.height - halfHandle,
            },
            {
                type: "bottom-right",
                x: bounds.x + bounds.width - halfHandle,
                y: bounds.y + bounds.height - halfHandle,
            },
        ];

        return handles

    }



}