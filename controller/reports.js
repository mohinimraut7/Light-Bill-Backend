
const Report = require('../models/report');
const mongoose = require("mongoose");
const axios = require('axios');
exports.addRemarkReports = async (req, res) => {
  try {
      const { _id, remark, role, signature, ward } = req.body;

      if (!_id || !role || !remark) {
          return res.status(400).json({ message: "Report ID (_id), role, and remark are required." });
      }

      // Find the existing report
      const existingReport = await Report.findById(_id);
      if (!existingReport) {
          return res.status(404).json({ message: "Report not found." });
      }

      // Ensure `reportingRemarks` array exists
      existingReport.reportingRemarks = existingReport.reportingRemarks || [];

      // Always add a new remark (no updates to existing remarks)
      existingReport.reportingRemarks.push({ 
          _id: new mongoose.Types.ObjectId(), 
          role, 
          remark, 
          ward,
          signature,
          date: new Date() 
      });

      // Save the updated remark
      const updatedRemark = await existingReport.save();

      res.status(200).json({
          message: "Remark added successfully.",
          reportingRemarks: updatedRemark.reportingRemarks, // Return updated reportingRemarks array
      });
  } catch (error) {
      console.error("Error adding reporting remark:", error);
      res.status(500).json({
          message: "An error occurred while adding the reporting remark.",
          error: error.message,
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