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
            case "add": //remove
                const addIndx = this.shapeList.findIndex(s => s.getShapeId() === action.shapeId)
                if (addIndx !== -1) {
                    this.shapeList.splice(addIndx, 1);
                }
                break;
            case "delete":  //restore
                this.shapeList.push(ShapeFactory.createShapeFromData(action.shapeData))
                break;
            case "modify":
                if (action.previousData) {
                    const indx = this.shapeList.findIndex(s => s.getShapeId() === action.shapeId)
                    if (indx !== -1) {
                        this.shapeList[indx] = ShapeFactory.createShapeFromData(action.previousData)

                    }
                    break;
                }
        }
        this.clearCanvasFn();

    }

    private executeRedo = (action: Command) => {

        switch (action.action) {
            case "add":
                this.shapeList.push(ShapeFactory.createShapeFromData(action.shapeData))
                break;

            case "modify":
                const indx = this.shapeList.findIndex(s => s.getShapeId() === action.shapeId)
                if (indx !== -1) {
                    this.shapeList[indx] = ShapeFactory.createShapeFromData(action.shapeData)
                }
                break;



            case "delete":
                const delIndx = this.shapeList.findIndex(s => s.getShapeId() === action.shapeId)
                if (delIndx !== -1) {
                    this.shapeList.splice(delIndx, 1);
                }
                break;


        }
        this.clearCanvasFn();


    }


}
