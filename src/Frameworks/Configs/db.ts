import mongoose from "mongoose";

const dbUrl:string = process.env.MONGO_URL!;

if(!dbUrl){
    console.log('MongoDB URI is not defined. Make sure to set the MONGO_URI environment variable.');
    process.exit(1);
}

const connectDB = async()=>{
    try {
        const connect = await mongoose.connect(dbUrl,{dbName:'Chat-Application'})
        console.log(`mongodb connected:${connect.connection.host}`);
        
    } catch (error) {
        console.log(error);
        setTimeout(connectDB, 5000);
    }
}

export default connectDB