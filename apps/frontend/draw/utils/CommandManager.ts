import { BaseShape } from "../shapes/BaseShape";
import { Shape } from "../types";
import { ShapeFactory } from "./ShapeFactory";


interface Command {
    action: "add" | "modify" | "delete";
    shapeId: string;
    shapeData: Shape;
    previousData?: Shape

}

export class CommandManager {
    private doStack: Command[] = [];
    private redoStack: Command[] = [];
    private shapeList: BaseShape[] = [];
    private clearCanvasFn: () => void;
    private MAX_UNDO_STEPS = 50;

    constructor(shapeList: BaseShape[], clearCanvasFn: () => void) {
        this.shapeList = shapeList;
        this.clearCanvasFn = clearCanvasFn;

    }

    add = (shape: BaseShape) => {
        this.doStack.push({
            action: "add",
            shapeId: shape.getShapeId(),
            shapeData: shape.serialize()
        });


        if (this.doStack.length > this.MAX_UNDO_STEPS) {
            this.doStack.shift();
        }
    }

    modify = (shape: BaseShape, previousShape: Shape) => {
        this.doStack.push({
            action: "modify",
            shapeId: shape.getShapeId(),
            shapeData: shape.serialize(),
            previousData: previousShape
        });

        if (this.doStack.length > this.MAX_UNDO_STEPS) {
            this.doStack.shift();
        }
    }
    delete = (shape: BaseShape) => {
        this.doStack.push({
            action: "delete",
            shapeId: shape.getShapeId(),
            shapeData: shape.serialize(),
        });

        if (this.doStack.length > this.MAX_UNDO_STEPS) {
            this.doStack.shift();
        }
    }

    undo() {
        if (this.doStack.length === 0) return;
        const action = this.doStack.pop();
        if (!action) return;
        this.executeUndo(action);
        this.redoStack.push(action);
        return action;

    }

    redo() {
        if (this.redoStack.length === 0) return;
        const action = this.redoStack.pop();
        if (!action) return;
        this.executeRedo(action);
        this.doStack.push(action);
        return action;

    }

    private executeUndo = (action: Command) => {


        switch (action.action) {
            case "add": // remove
                const shape = this.shapeList.find(s => s.getShapeId() === action.shapeId);
                if (shape) {
                    shape.markAsDeleted();
                }
                break;
            case "delete":  // restore
                const deletedShape = this.shapeList.find(s => s.getShapeId() === action.shapeId);
                if (deletedShape && deletedShape.getIsDeleted()) {
                    deletedShape.restore();
                }
                break;
            case "modify":
                if (action.previousData) {
                    const indx = this.shapeList.findIndex(s => s.getShapeId() === action.shapeId)
                    if (indx !== -1) {
                        const currentVersion = this.shapeList[indx].getVersion();
                        const restoredShape = ShapeFactory.createShapeFromData(action.previousData);
                        restoredShape.setMetadata(currentVersion + 1, Date.now(), undefined);
                        this.shapeList[indx] = restoredShape;
                    }
                    break;
                }
        }
        this.clearCanvasFn();


    }

    private executeRedo = (action: Command) => {

        switch (action.action) {
            case "add":
                const shape = this.shapeList.find(s => s.getShapeId() === action.shapeId);
                if (shape && shape.getIsDeleted()) {
                    shape.restore();
                }
                break;

            case "modify":
                if (action.shapeData) {
                    const indx = this.shapeList.findIndex(s => s.getShapeId() === action.shapeId)
                    if (indx !== -1) {
                        const currentVersion = this.shapeList[indx].getVersion();
                        const redoneShape = ShapeFactory.createShapeFromData(action.shapeData);
                        redoneShape.setMetadata(currentVersion + 1, Date.now(), undefined);
                        this.shapeList[indx] = redoneShape;
                    }
                    break;
                }
            case "delete":
                const deletedShape = this.shapeList.find(s => s.getShapeId() === action.shapeId);
                if (deletedShape) {
                    deletedShape.markAsDeleted();
                }
                break;


        }
        this.clearCanvasFn();


    }


}
