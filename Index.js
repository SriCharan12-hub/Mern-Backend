import express from "express"
import connect from "./Connection/Connect.js"
import dotenv  from "dotenv"
import route from "./Route/Userroute.js"

import cors from "cors"
import path from "path"


dotenv.config()
const app=express()

app.use(express.json())

// Set COOP/COEP headers to allow Google OAuth popups/postMessage

app.use(cors({
    origin:"https://mern-frontend-ahen.vercel.app/",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(route)



const port=process.env.port 
const mongo_uri=process.env.mongo_uri
async function Connecting() {  
try{
    connect(mongo_uri)
    app.listen(port,()=>{
    console.log(`Server running on Port ${port}`)
})

} 
catch{
    console.log("server not Started")
}
}
Connecting()
