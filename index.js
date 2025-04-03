const express=require('express');
// const bodyParser=require('bodyParser');
const env = require("dotenv");
const app=express();
const mongoose=require('mongoose');
const path=require('path');
const cors = require("cors");
// const { verifyEmail} = require("./controller/user");

app.use(cors());
const addUserRoutes = require("./routes/user");
const addRoleRoutes=require('./routes/role');
const addBillRoutes=require('./routes/bill');
const addMasterRoutes=require('./routes/master');
const addMeterRoutes=require('./routes/meter');
const addConsumersRoutes=require('./routes/consumer');
const addTarriffRoutes=require('./routes/tarriff');
const addReportRoutes = require('./routes/report');
const imageRoutes = require('./routes/imageRoute'); 
app.use("/uploads", express.static("uploads"));
const port = process.env.PORT || 5000;

env.config();
mongoose
  .connect(
    `mongodb+srv://mohini:mohiniraut@cluster0.rxemnue.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    console.log("Database connected");
  });
  // app.use(express.json());
  // app.use(express.urlencoded({ extended: true }));

// Increase body size limit (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// // If using body-parser explicitly
// app.use(bodyParser.json({ limit: '100mb' }));
// app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));



  app.use('/api',addUserRoutes)
  app.use('/api',addRoleRoutes)
  app.use('/api',addBillRoutes)
  app.use('/api',addMasterRoutes)
  app.use('/api',addMeterRoutes)
  app.use('/api',addConsumersRoutes)
  app.use('/api',addTarriffRoutes)
  app.use('/api',addReportRoutes)
  app.use('/api',imageRoutes)
app.get('/',(req,res)=>{
res.send("Hello world....")
// app.get(`${process.env.BASEURL}/api/verify-email/:token`, verifyEmail);

});
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})
