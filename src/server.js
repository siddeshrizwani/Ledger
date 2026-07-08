// we will create server in this file
// now to run this server we will create a script in package.json
// "dev":"npx nodemon server.js"
// for production u will use start - node server.js
// change the first line to require("dotenv").config() to use the .env variables as process.env.variable-name

require("dotenv").config()
const app=require("./app.js")
const connectToDB=require("./config/db.js")
connectToDB()
app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})