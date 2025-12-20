import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';
import { handleChat, handleJoinRoom, handleLeaveRoom, handleMouseMovement, handleShapePreview, handleShapeUpdate, handleShapeDelete, removeUserFromRoom } from './handlers';
// import { JWT_SECRET } from '@repo/backend-common/config';


export interface ClientSession {
    sessionId: string;
    username: string;
    userId?: string;
    roomId: string | null;
    ws: WebSocket;
}

export class SocketServer {
    private static instance: SocketServer;
    private wss: WebSocketServer;
    private sessions: Map<string, ClientSession> = new Map();




    private constructor() {
        this.wss = new WebSocketServer({ port: 8080 });
        this.wss.on('connection', this.handleConnection);
    }

    public static getInstance() {
        if (!SocketServer.instance) {
            SocketServer.instance = new SocketServer();
        }
        return SocketServer.instance

    }


    // private checkUser = (token: string) => {    //currently auth removed -> might need in future 
    //     try {
    //         const decoded = jwt.verify(token, JWT_SECRET);
    //         if (typeof decoded == "string") {
    //             return null
    //         }
    //         if (!decoded || !decoded.userId) {
    //             return null;
    //         }
    //         return decoded.userId;
    //     } catch (error) {
    //         return null;
    //     }
    // }

    private cleanUpSession = (sessionId: string) => {
        const session = this.sessions.get(sessionId)
        if (!session) return;


        if (session.roomId) {
            removeUserFromRoom(sessionId);
        }


        this.sessions.delete(sessionId)
    }

    private heartBeat = (sessionId: string) => {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const pingInterval = setInterval(() => {
            if (session?.ws.readyState === WebSocket.OPEN) {
                session.ws.ping();
            } else {
                this.cleanUpSession(sessionId);
                clearInterval(pingInterval)

            }

        }, 30000)
        session.ws.on('pong', () => {

        });
    }

    private handleConnection = (ws: WebSocket, request: any) => {
        const url = request.url;
        console.log(url)
        if (!url) {
            return
        }

        const queryParam = new URLSearchParams(url.split("?")[1]);


        const username = queryParam.get('username') || 'anonymous';


        // const token = queryParam.get('token') || "";
        // const userId = this.checkUser(token);
        // if (userId == null) {
        //     ws.close();
        //     return;
        // }

        const sessionId = crypto.randomUUID();
        const session: ClientSession = {
            sessionId,
            username,
            userId: undefined,
            roomId: null,
            ws
        }
        this.sessions.set(sessionId, session)

        ws.send(JSON.stringify({
            type: "session-init",
            sessionId,
        }));

        this.heartBeat(sessionId)
        console.log('setting sesssion id as -----------------------------', sessionId)

        ws.on('error', console.error);
        ws.on('message', (data) => this.handleMessage(data, sessionId));
        ws.on('close', (data) => this.handleClose(ws))

    }

    private handleClose = (ws: WebSocket) => {

        Object.entries(this.sessions).forEach(([sessionId, session]) => {
            if (session.ws === ws) {
                this.cleanUpSession(sessionId)
            }
        })
        ws.close();
    }

    private handleMessage = (data: any, sessionId: string) => {
        let parsedData;
        const session = this.sessions.get(sessionId);
        if (!session) return

        try {


            if (typeof data !== "string") {
                parsedData = JSON.parse(data.toString())
            } else {
                parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
            }

        } catch (err) {
            console.error("Invalid JSON received:", data, err);
            return;

        }
        if (parsedData.type !== "mouseMovement") {
            console.log('handlemessage" ', parsedData)

        }


        switch (parsedData.type) {
            case 'join_room':
                handleJoinRoom(session, parsedData)
                break;
            case 'leave_room':
                handleLeaveRoom(session, parsedData)
                break;
            case 'chat':
                handleChat(session, this.sessions, parsedData)
                break;
            case 'mouseMovement':
                handleMouseMovement(session, this.sessions, parsedData)
                break;
            case 'shapeUpdate':
                handleShapeUpdate(session, this.sessions, parsedData)
                break;
            case 'shapeDelete':
                handleShapeDelete(session, this.sessions, parsedData)
                break;
            case 'shapePreview':
                handleShapePreview(session, this.sessions, parsedData)
                break;

            default:
                break;
        }
    }

}