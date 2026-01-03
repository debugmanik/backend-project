//require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
dotenv.config({
    path: "./.env"
});
connectDB()
.then(( ) => {
app.listen(process.env.PORT || 8000, () => {
console.log(` Server is running at port : $
{process.env.PORT}`);
})
})
.catch((err) => {
console.log("MONGO db connection failed !!! ",err);
})
/*
(async()=>{
    try{
        await mongoose.connect{
        }
    }
})
    */
   
