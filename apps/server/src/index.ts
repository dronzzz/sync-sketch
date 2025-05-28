import express, { Request, Response } from "express";
import bcrypt from "bcrypt"
import {
    CreateRoomSchema,
    CreateUserSchema,
    signInSchema,
} from "@repo/common/types";
import { middleware } from "./middleware";
import { prisma } from "@repo/db/client";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

const app = express();
app.use(express.json());
const port = 3001;
const saltRound = 11;

app.get("/", (req, res) => {
    res.json({
        message: "backend working ",
    });
});

app.post("/signup", async (req: Request, res: Response) => {
    const parsedData = CreateUserSchema.safeParse(req.body);

    if (!parsedData.success) {
         res.json({
            message: "unauthorised",
        });
        return;
    }
    try {
        const hashedPassword = await bcrypt.hash(parsedData.data.password, saltRound)

        const newUser = await prisma.user.create({
            data: {
                email: parsedData.data.email,
                password: hashedPassword,
                name: parsedData?.data.name,
            },
        });
        const paylaod = {
            userId: newUser.id,
            email: newUser.email,
        };
        const token = jwt.sign(paylaod, JWT_SECRET);

        res.json({
            token,
        });
    } catch {

        res.status(511).json({
            message: "A user with this email already exist",
        });
    }

});

app.post("/signin",async (req: Request, res: Response) => {
    const parsedData = signInSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "unauthorised",
        });
        return;
    }

    const user = await prisma.user.findUnique({
        where: {
            email: parsedData.data.email,
        },
    });

    if (!user) {
         res.status(401).json({
            message: "invalid username no such user exist",
        });
        return
    }
    const isPasswordCorrect = await bcrypt.compare(parsedData.data.password, user.password)

    if (!isPasswordCorrect) {
         res.status(401).json({
            message: "invalid credentials"
        })
        return
    }
    const payload = {
        userId: user.id,
        email: user.email
    };

    const token = await jwt.sign(payload, JWT_SECRET);
    res.status(200).json({
        token,
    });
});

app.post("/create-room", middleware,async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "unauthorised",
        });
        return 
    }
    //@ts-ignore
    const userId = req.userId;

    try {
        
        const newRoom = await prisma.room.create({
            data:{
                slug : parsedData.data.slug,
                adminId : userId
    
            }
        })
    
    
    
        res.status(200).json({ message: newRoom.id });
    } catch (error) {
        res.json({
            message:"Room already exist with this slug name"
        })
        
    }

});

app.listen(port, () => {
    console.log(`server is running on ${port}`);
});
