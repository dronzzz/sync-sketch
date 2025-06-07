import { BACKEND_URL } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string) {
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);

    const messages = response.data.messages;

    const shape = messages.map((x: { message: string }) => {
        const messageData = JSON.parse(x.message);
        return messageData;
    });
    return shape;
}
