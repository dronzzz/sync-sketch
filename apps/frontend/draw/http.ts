import { BACKEND_URL } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string) {

    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);

    const messages = response.data.messages;
    console.log(messages)



    const shape = messages.map((x: { data: string | object }) => {
        // Handle both string and object data from backend
        const messageData = typeof x.data === 'string' ? JSON.parse(x.data) : x.data;
        return messageData;
    });

    return shape;
}
