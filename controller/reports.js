
const Report = require('../models/report');
const mongoose = require("mongoose");
const axios = require('axios');


// exports.addRemarkReports = async (req, res) => {
//   try {
//       const { _id, remark, role, signature, ward } = req.body;

//       if (!_id || !role || !remark) {
//           return res.status(400).json({ message: "Report ID (_id), role, and remark are required." });
//       }

//       // Find the existing report
//       const existingReport = await Report.findById(_id);
//       if (!existingReport) {
//           return res.status(404).json({ message: "Report not found." });
//       }

//       // Ensure `reportingRemarks` array exists
//       existingReport.reportingRemarks = existingReport.reportingRemarks || [];

//       // Always add a new remark (no updates to existing remarks)
//       existingReport.reportingRemarks.push({ 
//           _id: new mongoose.Types.ObjectId(), 
//           role, 
//           remark, 
//           ward,
//           signature,
//           date: new Date() 
//       });

//       // Save the updated remark
//       const updatedRemark = await existingReport.save();

//       res.status(200).json({
//           message: "Remark added successfully.",
//           reportingRemarks: updatedRemark.reportingRemarks, // Return updated reportingRemarks array
//       });
//   } catch (error) {
//       console.error("Error adding reporting remark:", error);
//       res.status(500).json({
//           message: "An error occurred while adding the reporting remark.",
//           error: error.message,
//       });
//   }
// };

// ================================================================
// exports.addRemarkReports = async (req, res) => {

    
//     try {
//         console.log("🛠 Incoming request body:", req.body); // Debugging request
  
//         const { remark, role,signature,ward } = req.body;
  
//         // // Validate required fields
//         // if (!_id || !role || !remark) {
//         //     console.log("❌ Missing required fields");
//         //     return res.status(400).json({ message: "Report ID (_id), role, and remark are required." });
//         // }
  
//         // Find the existing report

//         const existingReport = await Report.findById(_id);
//         // if (!existingReport) {
//         //     console.log("❌ Report not found for ID:", _id);
//         //     return res.status(404).json({ message: "Report not found." });
//         // }
  
//         console.log("✅ Report found:", existingReport);
  
//         // Ensure reportingRemarks array exists
//         if (!existingReport.reportingRemarks) {
//             existingReport.reportingRemarks = [];
//         }
  
//         // Add new remark
       
//         const newRemark = { 
//             // _id: new mongoose.Types.ObjectId(),
//             role, 
//             remark, 
//             ward,
//             signature,
//             date: new Date()
//         };
  
//         existingReport.reportingRemarks.push(newRemark);
  
//         // Save updated report
//         const updatedReport = await existingReport.save();
//         console.log("✅ Remark added successfully:", newRemark);
  
//         res.status(200).json({
//             message: "Remark added successfully.",
//             newRemark,
//             reportingRemarks: updatedReport.reportingRemarks
//         });
  
//     } catch (error) {
//         console.error("🚨 Error adding remark:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the remark.",
//             error: error.message
//         });
//     }
//   };
//   =================================================


exports.addRemarkReports = async (req, res) => {
    try {
        console.log("🛠 Incoming request body:", req.body); // Debugging request

        const { remark, role, signature, ward } = req.body;

        // ✅ Validate required fields
        if (!role || !remark) {
            console.log("❌ Missing required fields");
            return res.status(400).json({ message: "Role and remark are required." });
        }

        // ✅ Create a new report entry with the remark
        const newReport = new Report({
            reportingRemarks: [{
                role,
                remark,
                ward,
                signature,
                date: new Date()
            }]
        });

        // ✅ Save the new report in the database
        const savedReport = await newReport.save();
        console.log("✅ Remark added successfully:", savedReport);

        res.status(201).json({
            message: "Remark added successfully.",
            report: savedReport
        });

    } catch (error) {
        console.error("🚨 Error adding remark:", error);
        res.status(500).json({
            message: "An error occurred while adding the remark.",
            error: error.message
        });
    }
};



exports.getReports = async (req, res) => {
    try {
      const reports = await Report.find();
      res.status(200).json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };