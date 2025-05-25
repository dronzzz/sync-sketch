import express, { Request, Response } from "express";


import { CreateRoomSchema, CreateUserSchema, signInSchema } from "@repo/common/types";
import { middleware } from "./middleware";


const app = express();
app.use(express.json());
const port = 3100;

app.get('/',(req,res)=>{
    res.json({
        message : "backend working "
    })

})

app.post('/signup',(req:Request,res:Response)=>{

 const {success} = CreateRoomSchema.safeParse(req.body);
    if(!success){
        return res.json({
            message:"unauthorised"
        })
      
    }





 res.status(200).json({
            message:"success"
        })
})

app.post('/signin', (req,res)=>{
    const {success} = signInSchema.safeParse(req.body);
    if(!success){
        return res.json({
            message:"unauthorised"
        })
      
    }



    res.json({
        token:"jwttoekn"}
    )
})


app.post('/create-room',middleware, (req,res)=>{

   const {success} = CreateRoomSchema.safeParse(req.body);
    if(!success){
        return res.json({
            message:"unauthorised"
        })
    }
     res.status(200).json({ message: "Room created", });
}
)



app.listen(port , ()=>{
    console.log(`server is running on ${port}`)
})