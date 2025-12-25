import { Shape } from "../types";


export function mergeFullScene(localShapes: Shape[], remoteShapes: Shape[]): Shape[] {

    const shapeMap = new Map<string, Shape>();

    for (const shape of localShapes) {
        if (shape.id) shapeMap.set(shape.id, shape);
    }

    for (const remoteShape of remoteShapes) {
        if (!remoteShape.id) continue;

        const localShape = shapeMap.get(remoteShape.id);

        if (!localShape) {
            shapeMap.set(remoteShape.id, remoteShape);
        } else {
            const updatedShape = resolveShapeConflict(localShape, remoteShape);
            shapeMap.set(remoteShape.id, updatedShape)

        }

    }

    return Array.from(shapeMap.values());


}


export function mergeSingleShape(localShape: Shape[], remoteShape: Shape): Shape[] {

    const Index = localShape.findIndex(s => s.id === remoteShape.id);

    if (Index === -1) {
        return [...localShape, remoteShape];
    }

    const existingShape = localShape[Index];
    const winner = resolveShapeConflict(existingShape, remoteShape);

    if (winner === existingShape) return localShape;

    const updatedShapes = [...localShape];
    updatedShapes[Index] = winner;
    return updatedShapes;



}

function resolveShapeConflict(localShape: Shape, remoteShape: Shape): Shape {

    if (localShape.version < remoteShape.version) return remoteShape;
    if (localShape.version > remoteShape.version) return localShape;

    return localShape.editedAt > remoteShape.editedAt ? localShape : remoteShape;
}