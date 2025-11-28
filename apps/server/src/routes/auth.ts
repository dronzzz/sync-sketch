import { Router } from "express";
import { prisma } from "@repo/db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema, signInSchema } from "@repo/common/types";

const router: Router = Router();
const SALT_ROUNDS = 11;

router.post("/signup", async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);

    if (!parsedData.success) {

        res.status(400).json({ error: "Invalid data" });
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(parsedData.data.password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                email: parsedData.data.email,
                password: hashedPassword,
                name: parsedData.data.name,
            },
        });

        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);


        res.status(201).json({ token });

    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: "Email already exists" });
            return;
        }
        res.status(500).json({ error: "Signup failed" });
    }
});


router.post("/signin", async (req, res) => {
    const parsedData = signInSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({ error: "Invalid data" });
        return;
    }

    const user = await prisma.user.findUnique({

        where: { email: parsedData.data.email }
    });

    if (!user) {

        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const isValid = await bcrypt.compare(parsedData.data.password, user.password);

    if (!isValid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }


    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

    res.json({ token });

});

export default router;
