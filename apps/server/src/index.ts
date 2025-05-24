import express from "express";


const app = express();
const port = '3100';
app.get('/',(req,res)=>{
    res.json({
        msg : "backend working "
    })
})

app.listen(port , (req,res)=>{
    console.log(`server is running on ${port}`)
})