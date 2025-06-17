import { Pencil } from "../shapes/Pencil";
import { Ellipse } from "../shapes/Ellipse";
import { Line } from "../shapes/Line";
import { Rect } from "../shapes/Rect"
import { Shape } from "../types";
import { BaseShape } from "../shapes/BaseShape";
import { Diamond } from "../shapes/Diamond";


export class ShapeFactory {
    static createShapeFromData(shape:Shape):BaseShape{

        switch(shape.type){
            case 'rect':
                return new Rect(shape.x,shape.y,shape.width,shape.height,shape.color,shape.lineWidth, shape.id);
            case 'ellipse':
                return new Ellipse(shape.centerX,shape.centerY,shape.radiusX,shape.radiusY,shape.color,shape.lineWidth, shape.id);
            case 'line':
                return new Line(shape.startX,shape.startY,shape.endX,shape.endY,shape.color,shape.lineWidth, shape.id);
            case 'pencil':
                return new Pencil(shape.points,shape.color,shape.lineWidth, shape.id);
            case 'diamond':
                return new Diamond(shape.centerX,shape.centerY,shape.radiusX,shape.radiusY,shape.color,shape.lineWidth, shape.id);
            default:
                throw new Error('type of shpe dosent match')

        }
    }

}