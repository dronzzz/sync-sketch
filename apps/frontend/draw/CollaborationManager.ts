import { BaseShape } from "./shapes/BaseShape";
import { saveShape, SketchDB } from "@/lib/indexdb";
import { IDBPDatabase } from 'idb';
import { ShapeFactory } from "./utils/ShapeFactory";
import throttle from "lodash.throttle";
import { Shape } from "./types";
import { mergeFullScene } from "./utils/mergeScene";
import { getUsername } from "@/lib/username";
import { useMouseStore } from "@/store/useMouseStore";
import { useRoomStore } from "@/store/useRoomStore";

const sendMousePosition = throttle((socket: WebSocket, x: number, y: number, username: string) => {
    socket.send(JSON.stringify({
        type: "mouseMovement",
        x,
        y,
        username
    }))
}, 50)

const sendShapePreview = throttle((socket: WebSocket, inputShape: Shape, preview: string, sessionId: string) => {
    if (!sessionId) {
        console.warn('Attempting to send shape preview without session ID');
        return;
    }

    socket.send(JSON.stringify({
        type: "shapePreview",
        message: JSON.stringify(inputShape),
        previewType: preview,
    }))
}, 50)

export class CollaborationManager {
    private socket: WebSocket | null;
    private roomId: string | null;
    private sessionId: string | null = null;
    private isOnline: boolean;
    private username: string | null = null;
    private sceneInitialized: boolean = false;

    constructor(socket?: WebSocket | null, roomId?: string | null,
        private onShapeReceived: (shape: BaseShape) => void,
        private onShapeUpdated: (shape: BaseShape) => void,
        private onShapeDeleted: (shapeId: string) => void,
        private onShapePreview: (shape: Shape, previewType: string) => void,
        private onMouseMove: (userId: string, x: number, y: number, username: string) => void,
        private getTransform: () => { scale: number; panX: number; panY: number },
        private getExistingShapes: () => BaseShape[],
        private updateExistingShape: (shape: Shape[]) => void,
        private onSceneInitialized: () => void,
    ) {
        this.socket = socket || null;
        this.roomId = roomId || null;
        this.isOnline = !!(this.socket && this.roomId);
        this.initHandlers()


    }


    initHandlers() {
        console.log('Initializing WebSocket handlers');
        if (this.isOnline && this.socket) {


            this.socket.onmessage = async (event) => {
                try {
                    const message = JSON.parse(event.data);
                    // console.log('Raw incoming message:', event.data);
                    // console.log('Parsed incoming message:', message);

                    if (message.type === "new-user") {
                        this.handleSceneBroadCast(message.sessionId);

                    }
                    if (message.type === "scene-init") {
                        this.handleSceneInit(message);
                    }
                    if (message.type === "room-users") {
                        this.handleRoomUsers(message);
                    }
                    if (message.type === "scene-update") {
                        this.handleSceneUpdate(message);
                    }
                    if (message.type === "chat") {
                        const shapeData = JSON.parse(message.message)
                        const shape = ShapeFactory.createShapeFromData(shapeData)
                        this.onShapeReceived(shape);
                    }
                    if (message.type === "mouseMovement") {
                        const transform = this.getTransform(); //world coord --> screen coord
                        const screenX = message.x * transform.scale + transform.panX;
                        const screenY = message.y * transform.scale + transform.panY;
                        this.onMouseMove(message.sessionId, screenX, screenY, message.username);
                    }

                    if (message.type === 'shapeUpdate') {
                        const updatedShape = JSON.parse(message.message);
                        const shape = ShapeFactory.createShapeFromData(updatedShape)
                        this.onShapeUpdated(shape)
                    }

                    if (message.type === 'shapeDelete') {
                        this.onShapeDeleted(message.shapeId);


                    } else if (message.type === 'shapePreview') {
                        const previewShape = JSON.parse(message.message);
                        this.onShapePreview(previewShape, message.previewType);
                    }

                } catch (error) {
                    console.error('Error handling WebSocket message:', error);
                }
            };
        }
    }

    updateStore = async (shapeData: BaseShape, opt: 'shapeUpdate' | 'chat' | 'shapeDelete', dbPromise: IDBPDatabase<SketchDB>) => {
        const serialized = shapeData.serialize();

        if (!this.isOnline) {
            await saveShape(dbPromise, serialized);
        }



        if (this.isOnline && this.socket) {
            this.socket.send(JSON.stringify({
                type: opt,
                roomId: this.roomId,
                message: opt !== "shapeDelete" ? JSON.stringify(shapeData.serialize()) : null,
                shapeId: shapeData.getShapeId(),
                shapeType: serialized.type,
            }));
        }
    }

    setSessionId(id: string) {
        this.sessionId = id;
    }

    getSessionId(): string | null {
        return this.sessionId;
    }

    sendMousePosition(x: number, y: number) {
        if (!this.username) {
            this.username = getUsername()
        }
        if (this.isOnline && this.socket && this.roomId && this.sessionId) {
            sendMousePosition(this.socket, x, y, this.username);
        }

    }
    sendShapePreview(shape: Shape, previewType: 'new' | 'modification') {
        if (this.isOnline && this.socket && this.roomId && this.sessionId) {
            sendShapePreview(this.socket, shape, previewType, this.sessionId);
        }
    }

    handleSceneBroadCast(targetUserId: string) {
        const allShapes = this.getExistingShapes();
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket?.send(JSON.stringify({
                type: "scene-init",
                message: JSON.stringify(allShapes.map(shape => shape.serialize())),
                targetUserId,
            }))
        }
    }

    handleSceneInit(message: { shapes: string, fromUser: string }) {
        if (this.sceneInitialized) {
            return;
        }

        if (!message.shapes) {
            return;
        }

        this.sceneInitialized = true;

        const remoteShapes = JSON.parse(message.shapes);
        const localShapes = this.getExistingShapes().map(s => s.serialize());


        if (localShapes.length === 0) {
            this.updateExistingShape(remoteShapes);
        } else {
            const updatedScene = mergeFullScene(localShapes, remoteShapes);
            this.updateExistingShape(updatedScene);
        }


        this.onSceneInitialized();
    }

    handleRoomUsers(message: { users: { sessionId: string, username: string }[] }) {
        console.log('Room users updated:', message.users);

        useRoomStore.getState().setUsers(message.users);


        const { mousePositions, removeUser } = useMouseStore.getState();
        const activeIds = new Set(message.users.map(u => u.sessionId));

        for (const userId in mousePositions) {
            if (!activeIds.has(userId)) {
                removeUser(userId);
            }
        }
    }

    handleSceneUpdate(remoteShapes: Shape[]) {
        const localShapes = this.getExistingShapes().map(s => s.serialize());
        const updatedScene = mergeFullScene(localShapes, remoteShapes);

        this.updateExistingShape(updatedScene);
    }

}

