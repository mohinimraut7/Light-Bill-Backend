const express=require('express');
const env = require("dotenv");
const app=express();
const mongoose=require('mongoose');
const path=require('path');
const cors = require("cors");
app.use(cors());
const addUserRoutes = require("./routes/user");
const addRoleRoutes=require('./routes/role');
const addBillRoutes=require('./routes/bill');
const addMasterRoutes=require('./routes/master');
const addMeterRoutes=require('./routes/meter');
const addTarriffRoutes=require('./routes/tarriff');

const imageRoutes = require('./routes/imageRoute'); 
const port = process.env.PORT || 2000;

env.config();
mongoose
  .connect(
    `mongodb+srv://mohini:mohiniraut@cluster0.rxemnue.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    console.log("Database connected");
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api',addUserRoutes)
  app.use('/api',addRoleRoutes)
  app.use('/api',addBillRoutes)
  app.use('/api',addMasterRoutes)
  app.use('/api',addMeterRoutes)
  app.use('/api',addTarriffRoutes)
  
  app.use('/api',imageRoutes)
app.get('/',(req,res)=>{
res.send("Hello world....")
});
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})
