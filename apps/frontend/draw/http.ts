import { BACKEND_URL } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string) {
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);

    const messages = response.data.messages;


    const shape = messages.map((x: { data: string }) => {
        const messageData = x.data;
        return messageData;
    });

    return shape;
}
