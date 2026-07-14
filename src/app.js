// create server instance
// config the server -- middlewares , apis , etc
// dont start the server in app.js 
// start the server in server.js

const express=require("express");
const authRouter=require("./routes/auth.routes.js")
const accountRouter=require("./routes/account.routes.js")
const transactionRouter=require("./routes/transaction.routes.js")
const cookieParser=require("cookie-parser")

const app=express();

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transactions",transactionRouter)

module.exports=app 
