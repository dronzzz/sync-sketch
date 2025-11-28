import { Router } from "express";
import { prisma } from "@repo/db/client";
import { CreateRoomSchema } from "@repo/common/types";
import { middleware } from "../middleware";


const router: Router = Router();

function generateSlug(digits: number = 10) {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    let slug = "";
    for (let i = 0; i < digits; i++) {
        slug += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return slug;
}


router.post("/create-room-temp", async (req, res) => {
    try {
        const { shapes } = req.body;

        if (!Array.isArray(shapes)) {
            res.status(400).json({ error: "Invalid shapes" });
            return;
        }

        const slug = generateSlug();

        const room = await prisma.room.create({
            data: { slug, adminId: null as any }
        });


        if (shapes.length > 0) {
            await prisma.chat.createMany({
                data: shapes.map(shape => ({
                    roomId: room.id,
                    userId: null as any,
                    data: shape,
                    shapeId: shape.id,
                    type: shape.type,
                }))
            });
        }

        res.json({ id: room.id, slug: room.slug });

    } catch (error) {
        console.error("Create temp room error:", error);
        res.status(500).json({ error: "Failed to create room" });
    }
});


router.post("/create-room", middleware, async (req, res) => {    //currenlty removed as shifted from gated room to temp rooms
    const parsedData = CreateRoomSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({ error: "Invalid data" });
        return;
    }

    try {
        //@ts-ignore
        const userId = req.userId;

        const room = await prisma.room.create({
            data: {
                slug: parsedData.data.slug,
                adminId: userId
            }
        });

        res.json({ id: room.id, slug: room.slug });

    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: "Slug already exists" });
            return;
        }
        res.status(500).json({ error: "Failed to create room" });
    }
});


router.get("/chats/:roomId", async (req, res) => {
    const { roomId } = req.params;

    const messages = await prisma.chat.findMany({
        where: { roomId },
        orderBy: { id: "desc" },
        take: 50
    });

    res.json({ messages });
});


router.get("/room/:slug", async (req, res) => {
    const { slug } = req.params;

    const room = await prisma.room.findFirst({
        where: { slug }
    });

    if (!room) {
        res.status(404).json({ error: "Room not found" });
        return;
    }

    res.json({ roomId: room.id });
});

export default router;
