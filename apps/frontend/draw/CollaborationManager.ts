import { BaseShape } from "./shapes/BaseShape";
import { saveShape, SketchDB } from "@/lib/indexdb";
import { IDBPDatabase } from 'idb';
import throttle from "lodash.throttle";
import { Shape } from "./types";
import { mergeFullScene, mergeSingleShape } from "./utils/mergeScene";
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
}, 16)

const queuePeriodicSync = throttle((socket: WebSocket, getExistingShapes: () => BaseShape[]) => {
    const shapes = getExistingShapes();
    const serialized = shapes.map(shape => shape.serialize());

    socket.send(JSON.stringify({
        type: "scene-update",
        message: serialized,
    }))

}, 30000, { leading: false, trailing: true })

const sendShapePreview = throttle((socket: WebSocket, inputShape: Shape, preview: string, sessionId: string) => {
    if (!sessionId) {
        console.warn('Attempting to send shape preview without session ID');
        return;
    }

    socket.send(JSON.stringify({
        type: "shapePreview",
        message: inputShape,
        previewType: preview,
    }))
}, 16)

export class CollaborationManager {
    private socket: WebSocket | null;
    private roomId: string | null;
    private sessionId: string | null = null;
    private isOnline: boolean;
    private username: string | null = null;
    private sceneInitialized: boolean = false;

    constructor(socket?: WebSocket | null, roomId?: string | null,
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

                    switch (message.type) {
                        case 'new-user':
                            this.handleSceneBroadCast(message.sessionId);
                            break;
                        case 'scene-init':
                            this.handleSceneInit(message);
                            break;
                        case 'room-users':
                            this.handleRoomUsers(message);
                            break;
                        case 'scene-update':
                            this.handleSceneUpdate(message.message);
                            break;
                        case 'chat':
                        case 'shapeUpdate':
                        case 'shapeDelete':
                            this.handleSingleShapeUpdate(message.message);
                            break;
                        case "mouseMovement":
                            const transform = this.getTransform(); //world coord --> screen coord
                            const screenX = message.x * transform.scale + transform.panX;
                            const screenY = message.y * transform.scale + transform.panY;
                            this.onMouseMove(message.sessionId, screenX, screenY, message.username);
                            break;
                        case "shapePreview":
                            this.onShapePreview(message.message, message.previewType);
                            break;
                        default:
                            break;
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
                message: serialized,
                shapeId: shapeData.getShapeId(),
                shapeType: serialized.type,
            }));
            queuePeriodicSync(this.socket, this.getExistingShapes);
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
                message: allShapes.map(shape => shape.serialize()),
                targetUserId,
            }))
        }
    }

    handleSceneInit(message: { shapes: Shape[], fromUser: string }) {
        if (this.sceneInitialized) {
            return;
        }

        if (!message.shapes) {
            return;
        }

        this.sceneInitialized = true;

        const remoteShapes = message.shapes;

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

    handleSingleShapeUpdate(remoteShape: Shape) {
        const localShapes = this.getExistingShapes().map(s => s.serialize());
        const updatedShapes = mergeSingleShape(localShapes, remoteShape);
        this.updateExistingShape(updatedShapes);
    }

    handleSceneUpdate(remoteShapes: Shape[]) {
        const localShapes = this.getExistingShapes().map(s => s.serialize());
        const updatedScene = mergeFullScene(localShapes, remoteShapes);

        this.updateExistingShape(updatedScene);
    }

}

