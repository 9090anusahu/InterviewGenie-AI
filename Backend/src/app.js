 const express=require("express");
 const app=express();
 app.set("trust proxy", 1);
 const cookieParser = require("cookie-parser")
 const cors = require("cors")
 app.use(express.json())
 app.use(cookieParser())
 
//  app.use(cors({
//     origin: "http://localhost:5173",
//     credentials: true
// }))

const allowedOrigins = [
    "http://localhost:5173",
    "https://interview-genie-ai-lemon.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
//  require all api
 const authRouter=require("./routes/auth.routes")
 const interviewRouter = require("./routes/interview.routes")


// using all api
app.get("/", (req, res) => {
    res.send("Backend is working ✅");
});
 app.use("/api/auth",authRouter);
 app.use("/api/interview", interviewRouter)


 module.exports=app;