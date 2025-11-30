import { BACKEND_URL } from "@/config";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.shapes || !Array.isArray(body.shapes)) {
            return NextResponse.json(
                { error: 'Invalid shapes data' },
                { status: 400 }
            );
        }

        const resp = await fetch(`${BACKEND_URL}/create-room-temp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                shapes: body.shapes,
            })
        });

        if (!resp.ok) {
            const error = await resp.text();
            console.error('Backend error:', error);
            return NextResponse.json(
                { error: 'Failed to create room' },
                { status: resp.status }
            );
        }
        const { id, slug } = await resp.json();
        return NextResponse.json({ roomId: id, slug });



    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}