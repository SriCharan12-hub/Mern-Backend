import express from "express";
import connect from "./Connection/Connect.js";
import dotenv from "dotenv";
import route from "./Route/Userroute.js";
import cors from "cors";

dotenv.config();
const app = express();

app.use(express.json());

// CORS (safe)
app.use(cors({
    origin: "https://mern-frontend-m18p.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

// ❌ Removed COOP/COEP headers — they break OAuth postMessage

app.use(route);

const port = process.env.port;
const mongo_uri = process.env.mongo_uri;

async function Connecting() {
    try {
        connect(mongo_uri);
        app.listen(port, () => {
            console.log(`Server running on Port ${port}`);
        });
    } catch (err) {
        console.log("server not Started", err);
    }
}

Connecting();
