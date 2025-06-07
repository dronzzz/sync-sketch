
import CanvasClient from "@/components/CanvasClient";


export default async function ({
    params,
}: {
    params: {
        roomId: string;
    };
}) {
    const roomId = (await params).roomId;

    
    

    return (
        <div>
            <CanvasClient roomId={roomId} />
        </div>
    );
}
