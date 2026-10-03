// const express=require('express');

// const env = require("dotenv");
// const app=express();
// const mongoose=require('mongoose');
// const path=require('path');
// const cors = require("cors");
// app.use(cors({ origin: '*' }));
// // app.use(cors());
// const addUserRoutes = require("./routes/user");
// const addRoleRoutes=require('./routes/role');
// const addBillRoutes=require('./routes/bill');
// const addMasterRoutes=require('./routes/master');
// const addMeterRoutes=require('./routes/meter');
// const addConsumersRoutes=require('./routes/consumer');
// const addTarriffRoutes=require('./routes/tarriff');
// const addReportRoutes = require('./routes/report');
// const imageRoutes = require('./routes/imageRoute'); 
// app.use("/uploads", express.static("uploads"));
// const port = process.env.PORT || 5000;
// env.config();

// // Database: .env मध्ये MONGO_URI असेल तर तो (laptop = Atlas), नसेल तर local DB (server)
// const MONGO_URI =
//   process.env.MONGO_URI ||
//   "mongodb://127.0.0.1:27017/lightbill?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.3";

// mongoose
//   .connect(MONGO_URI)
//   .then(() => {
//     console.log("Database connected:", MONGO_URI.split("@").pop().split("?")[0]);
//   })
//   .catch((err) => {
//     console.error("MongoDB connection error:", err.message);
//   });




// app.use(express.json({ limit: '100mb' }));
// app.use(express.urlencoded({ limit: '100mb', extended: true }));
//   app.use('/api',addUserRoutes)
//   app.use('/api',addRoleRoutes)
//   app.use('/api',addBillRoutes)
//   app.use('/api',addMasterRoutes)
//   app.use('/api',addMeterRoutes)
//   app.use('/api',addConsumersRoutes)
//   app.use('/api',addTarriffRoutes)
//   app.use('/api',addReportRoutes)
//   app.use('/api',imageRoutes)
// app.get('/',(req,res)=>{
// res.send("Hello world .")
// });
// app.listen(port,()=>{
//     console.log(`Server is running on port ${port}`)
// })






// ------------------------------------------------------------------




const express=require('express');

const env = require("dotenv");
const app=express();
const mongoose=require('mongoose');
const path=require('path');
const cors = require("cors");
app.use(cors({ origin: '*' }));

// ─── GZIP COMPRESSION (3-Oct-2026) ───────────────────────────────────────────
// 10,000 bills चा JSON response अनेक MB असतो; gzip मुळे तो ~8-10 पट लहान होतो.
// Browser आपोआप unzip करतो — frontend मध्ये कोणताही बदल लागत नाही.
// Server वर एकदा `npm install compression` करा. Package नसेल तर server crash होणार नाही,
// फक्त compression बंद राहील.
try {
  const compression = require('compression');
  app.use(compression());
  console.log('Response compression enabled');
} catch (e) {
  console.warn('compression package not installed — run `npm install compression` for faster API responses');
}
// app.use(cors());
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

// Database: .env मध्ये MONGO_URI असेल तर तो (laptop = Atlas), नसेल तर local DB (server)
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/lightbill?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.3";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Database connected:", MONGO_URI.split("@").pop().split("?")[0]);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });




app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
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
res.send("Hello world .")
});
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})

