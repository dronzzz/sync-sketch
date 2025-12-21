import { BaseShape } from "./shapes/BaseShape";
import { saveShape, SketchDB } from "@/lib/indexdb";
import { IDBPDatabase } from 'idb';
import { ShapeFactory } from "./utils/ShapeFactory";
import throttle from "lodash.throttle";
import { Shape } from "./types";



const sendMousePosition = throttle((socket: WebSocket, x: number, y: number, roomId: string, sessionId: string) => {
    socket.send(JSON.stringify({
        type: "mouseMovement",
        x,
        y,
        roomId,
        sessionId,
    }))
}, 100)

const sendShapePreview = throttle((socket: WebSocket, inputShape: Shape, roomId: string, preview: string, sessionId: string) => {
    if (!sessionId) {
        console.warn('Attempting to send shape preview without session ID');
        return;
    }

    socket.send(JSON.stringify({
        type: "shapePreview",
        roomId: roomId,
        message: JSON.stringify(inputShape),
        previewType: preview,
        sessionId
    }))
}, 100)


export class CollaborationManager {
    private socket: WebSocket | null;
    private roomId: string | null;
    private sessionId: string | null = null;
    private isOnline: boolean;

    constructor(socket?: WebSocket | null, roomId?: string | null,
        private onShapeReceived: (shape: BaseShape) => void,
        private onShapeUpdated: (shape: BaseShape) => void,
        private onShapeDeleted: (shapeId: string) => void,
        private onShapePreview: (shape: Shape, previewType: string) => void,
        private onMouseMove: (userId: string, x: number, y: number) => void,
        private getTransform: () => { scale: number; panX: number; panY: number }
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

                    if (message.type === "session-init") {
                        // console.log('Received session-init message:', message);
                        this.sessionId = message.sessionId;
                        // console.log('Session ID set to:', this.sessionId);
                        return;
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
                        this.onMouseMove(message.userId, screenX, screenY);
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
                sessionId: this.sessionId,
                shapeType: shapeData.constructor.name.toLowerCase(),
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
        if (this.isOnline && this.socket && this.roomId && this.sessionId) {
            sendMousePosition(this.socket, x, y, this.roomId, this.sessionId);
        }

    }
    sendShapePreview(shape: Shape, previewType: 'new' | 'modification') {
        if (this.isOnline && this.socket && this.roomId && this.sessionId) {
            sendShapePreview(this.socket, shape, this.roomId, previewType, this.sessionId);
        }
    }




}

