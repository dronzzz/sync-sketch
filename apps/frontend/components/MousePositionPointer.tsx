import { useMouseStore } from "@/store/useMouseStore";
import { MousePointer2 } from "lucide-react";
const crypto = require('crypto');

export default function MousePositionPointer() {
    const MousePositions = useMouseStore((state) => state.mousePositions)
    return (
        <div>


            {Object.entries(MousePositions).map(([userId, { x: width, y: height, username }]) => {
                return <div
                    key={userId}
                    className="absolute z-40 pointer-events-none flex flex-col items-center"
                    style={{
                        top: height,
                        left: width,

                    }}
                >
                    <MousePointer2
                        style={{
                            color: getPointerColor(userId),
                            height: "20px",
                            width: "20px",
                        }}
                    />
                    <div
                        className="text-white text-xs px-1 py-1 rounded absolute top-5 left-5 whitespace-nowrap"
                        style={{
                            backgroundColor: getPointerColor(userId),
                        }}
                    >
                        {username}
                    </div>
                </div>


            })
            }

        </div>

    );
}


function getPointerColor(sessionId: string): string {
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
        hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 55%)`;
}