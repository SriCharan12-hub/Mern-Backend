import express from "express"
import connect from "./Connection/Connect.js"
import dotenv  from "dotenv"
import route from "./Route/Userroute.js"

import cors from "cors"
import path from "path"


dotenv.config()
const app=express()

app.use(express.json())
app.use(cors({
    methods: ["GET", "POST", "PUT", "DELETE"]
}))
// Set COOP/COEP headers to allow Google OAuth popups/postMessage
app.use((req, res, next) => {
    // allow popups to communicate back to opener (needed by some OAuth flows)
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    // keep embedder policy permissive (default) so we don't block resources
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
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