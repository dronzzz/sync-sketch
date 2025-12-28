import { Pencil } from "../shapes/Pencil";
import { Ellipse } from "../shapes/Ellipse";
import { Line } from "../shapes/Line";
import { Rect } from "../shapes/Rect"
import { Shape } from "../types";
import { BaseShape } from "../shapes/BaseShape";
import { Diamond } from "../shapes/Diamond";
import { Arrow } from "../shapes/Arrow";
import { TextShape } from "../shapes/TextShape";


export class ShapeFactory {
    static createShapeFromData(shape: Shape): BaseShape {
        let instance: BaseShape;

        switch (shape.type) {
            case 'rect':
                instance = new Rect(shape.x, shape.y, shape.width, shape.height, shape.color, shape.lineWidth, shape.id);
                break;
            case 'ellipse':
                instance = new Ellipse(shape.centerX, shape.centerY, shape.radiusX, shape.radiusY, shape.color, shape.lineWidth, shape.id);
                break;
            case 'line':
                instance = new Line(shape.startX, shape.startY, shape.endX, shape.endY, shape.color, shape.lineWidth, shape.id);
                break;
            case 'pencil':
                instance = new Pencil(shape.points, shape.color, shape.lineWidth, shape.id);
                break;
            case 'diamond':
                instance = new Diamond(shape.centerX, shape.centerY, shape.radiusX, shape.radiusY, shape.color, shape.lineWidth, shape.id);
                break;
            case 'arrow':
                instance = new Arrow(shape.startX, shape.startY, shape.endX, shape.endY, shape.color, shape.lineWidth, shape.id);
                break;
            case 'text':
                instance = new TextShape(shape.startX, shape.startY, shape.color, shape.lineWidth, shape.textContent || "", shape.fontSize, shape.id);
                break;
            default:
                throw new Error('type of shpe dosent match')
        }

        instance.setMetadata(shape.version, shape.editedAt, shape.isDeleted);
        return instance;
    }

}