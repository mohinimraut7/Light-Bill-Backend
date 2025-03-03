const Bill = require('../models/bill');
const mongoose = require("mongoose");
const User = require('../models/user'); 
const Meter = require('../models/meter'); 
const bcrypt=require('bcryptjs');
const Consumer = require('../models/consumer'); 
const cron = require("node-cron");
const axios = require('axios');

// exports.addBill = async (req, res) => {
//   // const requesterRole = req?.user?.role;
//   // if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterRole !=='Executive Engineer' && requesterRole !=='Junior Engineer') { 
//   //   return res.status(403).json({ message: "You don't have authority to add bill" }); 
//   // }
//   try {
//     const {
//       consumerNumber,
//       consumerName,
//       consumerAddress,
//       contactNumber,
//       ward,
//       adjustmentUnit,
//       totalConsumption,
//       installationDate,
//       tarriffDescription,
//       meterNumber,
//       meterStatus,
//       phaseType,
//       billingUnit,
//       netLoad,  
//       sanctionedLoad,
//       billDate,
//       billNo,
//       monthAndYear,
//       previousReadingDate,
//       previousReading,
//       currentReadingDate,
//       currentReading,
//       netBillAmount,
//       paymentStatus,
//       approvedStatus,
//       lastReceiptAmount,
//       lastReceiptDate,
//       promptPaymentDate,
//       promptPaymentAmount,
//       dueDate,
//       netBillAmountWithDPC,
//       dueAlert,
//       forwardForGeneration,
//     } = req.body;


//     let juniorEngineerContactNumber = null;
//     if (req.body.ward) {
//       try {
//                const juniorEngineer = await User.findOne({
//           role: 'Junior Engineer',
//           ward: req.body.ward,
//         });

        
//         if (juniorEngineer && juniorEngineer.ward === req.body.ward) {
          
//           juniorEngineerContactNumber = juniorEngineer.contactNumber;
//         }
//       } catch (error) {
//         console.error('Error fetching Junior Engineer contact:', error);
//       }
//     }

//     const bill = new Bill({
//       consumerNumber,
//       consumerName,
//       consumerAddress,
//       contactNumber,
//       ward,
//       adjustmentUnit,
//       totalConsumption,
//       installationDate,
//       tarriffDescription,
//       meterNumber,
//       meterStatus,
//       phaseType,
//       billingUnit,
//       netLoad,  
//       sanctionedLoad,
//       billDate,
//       billNo,
//       monthAndYear,
//       previousReadingDate,
//       previousReading,
//       currentReadingDate,
//       currentReading,
//       netBillAmount,
//       paymentStatus,
//       lastReceiptAmount,
//       lastReceiptDate,
//       promptPaymentDate,
//       promptPaymentAmount,
//       dueDate,
//       netBillAmountWithDPC,
//       dueAlert,
//       approvedStatus,
//       forwardForGeneration,
//       juniorEngineerContactNumber,
//     });
//     // if (lastReceiptAmount === roundedBillAmount) {
//     //   bill.paymentStatus = 'Paid';
//     //   switch (requesterRole) {
//     //     case 'Junior Engineer':
//     //       bill.approvedStatus = 'PendingForExecutiveEngineer';
//     //       bill.paymentStatus = 'Paid';
//     //       break;
//     //     case 'Executive Engineer':
//     //       bill.approvedStatus = 'PendingForAdmin';
//     //       bill.paymentStatus = 'Paid';
//     //       break;
//     //     case 'Admin':
//     //       bill.approvedStatus = 'PendingForSuperAdmin';
//     //       bill.paymentStatus = 'Paid';
//     //       break;
//     //     case 'Super Admin':
//     //       bill.approvedStatus = 'Done';
//     //       bill.paymentStatus = 'Paid';
//     //       break;
//     //     default:
//     //       console.error(`Unexpected role: ${requesterRole}`);
//     //       break;
//     //   }
//     // }else if (lastReceiptAmount > 0 && lastReceiptAmount < roundedBillAmount) {
//     //   bill.paymentStatus = 'Partial';
//     //   switch (requesterRole) {
//     //     case 'Junior Engineer':
//     //       bill.approvedStatus = 'PendingForExecutiveEngineer';
//     //       bill.paymentStatus = 'Partial';
//     //       break;
//     //     case 'Executive Engineer':
//     //       bill.approvedStatus = 'PendingForAdmin';
//     //       bill.paymentStatus = 'Partial';

//     //       break;
//     //     case 'Admin':
//     //       bill.approvedStatus = 'PendingForSuperAdmin';
//     //       bill.paymentStatus = 'Partial';
//     //       break;
//     //     case 'Super Admin':
//     //       bill.approvedStatus = 'PartialDone';
//     //       bill.paymentStatus = 'Partial';
//     //       break;
//     //     default:
//     //       console.error(`Unexpected role: ${requesterRole}`);
//     //       break;
//     //   }
//     // } else {
      
//     //     bill.paymentStatus = 'Pending';
    
//     // }
//     await bill.save();
//     res.status(201).json({
//       message: 'Bill created successfully',
//       bill: {
//         consumerNumber: bill.consumerNumber,
//         monthAndYear: bill.monthAndYear,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Failed to create bill',
//       error: error.message,
//     });
//   }
// };

// ------------------------------------------------------------------------------------------

// exports.addBill = async (req, res) => {
//   try {
//     const bills = Array.isArray(req.body) ? req.body : [req.body]; 

//     const createdBills = []; 

//     for (const billData of bills) {
//       const {
//         consumerNumber,
//         consumerName,
//         consumerAddress,
//         contactNumber,
//         ward,
//         adjustmentUnit,
//         totalConsumption,
//         installationDate,
//         tarriffDescription,
//         meterNumber,
//         meterStatus,
//         phaseType,
//         billingUnit,
//         netLoad,
//         sanctionedLoad,
//         billDate,
//         billNo,
//         monthAndYear,
//         previousReadingDate,
//         previousReading,
//         currentReadingDate,
//         currentReading,
//         netBillAmount,
//         paymentStatus,
//         lastReceiptAmount,
//         lastReceiptDate,
//         promptPaymentDate,
//         promptPaymentAmount,
//         dueDate,
//         netBillAmountWithDPC,
//         dueAlert,
//       } = billData;

//       let juniorEngineerContactNumber = null;
//       if (billData.ward) {
//         try {
//           const juniorEngineer = await User.findOne({
//             role: 'Junior Engineer',
//             ward: billData.ward,
//           });

//           if (juniorEngineer && juniorEngineer.ward === billData.ward) {
//             juniorEngineerContactNumber = juniorEngineer.contactNumber;
//           }
//         } catch (error) {
//           console.error('Error fetching Junior Engineer contact:', error);
//         }
//       }

//       const bill = new Bill({
//         consumerNumber,
//         consumerName,
//         consumerAddress,
//         contactNumber,
//         ward,
//         adjustmentUnit,
//         totalConsumption,
//         installationDate,
//         tarriffDescription,
//         meterNumber,
//         meterStatus,
//         phaseType,
//         billingUnit,
//         netLoad,
//         sanctionedLoad,
//         billDate,
//         billNo,
//         monthAndYear,
//         previousReadingDate,
//         previousReading,
//         currentReadingDate,
//         currentReading,
//         netBillAmount,
//         paymentStatus,
//         lastReceiptAmount,
//         lastReceiptDate,
//         promptPaymentDate,
//         promptPaymentAmount,
//         dueDate,
//         netBillAmountWithDPC,
//         dueAlert,
//         juniorEngineerContactNumber,
//       });

//       await bill.save();
//       createdBills.push({
//         consumerNumber: bill.consumerNumber,
//         monthAndYear: bill.monthAndYear,
//       });
//     }

//     // Send response based on the number of bills created
//     if (createdBills.length === 1) {
//       res.status(201).json({
//         message: 'Bill created successfully',
//         bill: createdBills[0],  // Single bill response
//       });
//     } else {
//       res.status(201).json(
//         createdBills,
//       );
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Failed to create bill',
//       error: error.message,
//     });
//   }
// };
// -------------------------------------------------------
// exports.addBill = async (req, res) => {
//   try {
//     const bills = Array.isArray(req.body) ? req.body : [req.body];

//     const createdBills = [];

//     for (const billData of bills) {
//       const {
//         consumerNumber,
//         consumerName,
//         consumerAddress,
//         contactNumber,
//         ward,
//         adjustmentUnit,
//         totalConsumption,
//         installationDate,
//         tarriffDescription,
//         meterNumber,
//         meterStatus,
//         phaseType,
//         billingUnit,
//         netLoad,
//         sanctionedLoad,
//         billDate,
//         billNo,
//         monthAndYear,
//         previousReadingDate,
//         previousReading,
//         currentReadingDate,
//         currentReading,
//         netBillAmount,
//         paymentStatus,
//         lastReceiptAmount,
//         lastReceiptDate,
//         promptPaymentDate,
//         promptPaymentAmount,
//         dueDate,
//         netBillAmountWithDPC,
//         dueAlert,
//       } = billData;

//       let status = "Success";  

      
//       if (!consumerNumber || !monthAndYear) {
//         status = "Failure";  
//       }

//       const bill = new Bill({
//         consumerNumber,
//         consumerName,
//         consumerAddress,
//         contactNumber,
//         ward,
//         adjustmentUnit,
//         totalConsumption,
//         installationDate,
//         tarriffDescription,
//         meterNumber,
//         meterStatus,
//         phaseType,
//         billingUnit,
//         netLoad,
//         sanctionedLoad,
//         billDate,
//         billNo,
//         monthAndYear,
//         previousReadingDate,
//         previousReading,
//         currentReadingDate,
//         currentReading,
//         netBillAmount,
//         paymentStatus,
//         lastReceiptAmount,
//         lastReceiptDate,
//         promptPaymentDate,
//         promptPaymentAmount,
//         dueDate,
//         netBillAmountWithDPC,
//         dueAlert,
//       });

//       await bill.save();
//       createdBills.push({
//         consumerNumber: bill.consumerNumber,
//         monthAndYear: bill.monthAndYear,
//         status: status, 
//       });
//     }

    
//     if (createdBills.length === 1) {
//       res.status(201).json(createdBills[0]); 
//     } else {
//       res.status(201).json(createdBills);  
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Failed to create bill',
//       error: error.message,
//     });
//   }
// };
// -----------------------------------------------------------------


cron.schedule("40 16 * * *", async () => {
  console.log("its 12")
  try {
    const today = new Date();
    
    today.setDate(today.getDate() + 2); // Find bills due in 2 days
    const dueDateString = today.toISOString().split("T")[0];

    // Update only bills where paymentStatus is "unpaid" (case insensitive)
    await Bill.updateMany(
      { dueDate: dueDateString, paymentStatus: "unpaid" },
      { dueAlert: true }
    );  

    console.log("Due alerts updated successfully for unpaid bills!");
  } catch (error) {
    console.error("Error updating due alerts:", error);
  }
});



cron.schedule("46 16 * * *", async () => { 
  console.log("Updating due alerts...");
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Find bills whose due date has passed
    const oldDueDateString = yesterday.toISOString().split("T")[0];

    // 1️⃣ Unpaid bills: Convert dueAlert to false (Overdue alert removed)
    const unpaidUpdate = await Bill.updateMany(
      { dueDate: oldDueDateString, dueAlert: true, paymentStatus: { $regex: /^unpaid$/i } },
      { $set: { dueAlert: false } } // Overdue alert is removed
    );

    console.log(`✅ ${unpaidUpdate.modifiedCount} unpaid bills updated!`);

    // 2️⃣ Paid bills: Reset dueAlert to false (No overdue alert check)
    const paidUpdate = await Bill.updateMany(
      { dueAlert: true, paymentStatus: { $regex: /^paid$/i } },
      { $set: { dueAlert: false } } // Reset due alerts
    );

    console.log(`✅ ${paidUpdate.modifiedCount} paid bills cleared from alerts!`);
    
  } catch (error) {
    console.error("❌ Error updating alerts:", error);
  }
});

const getPreviousMonthYear = (monthAndYear) => {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const [month, year] = monthAndYear.split('-');
  let monthIndex = months.indexOf(month.toUpperCase());
  let prevYear = parseInt(year, 10);

  // If current month is JAN, then previous month is DEC of the previous year.
  if (monthIndex === 0) {
    monthIndex = 11; // DEC
    prevYear -= 1;
  } else {
    monthIndex -= 1;
  }
  return `${months[monthIndex]}-${prevYear}`;
};


exports.addBill = async (req, res) => {
  try {
    const bills = Array.isArray(req.body) ? req.body : [req.body];
    const createdBills = [];
    const failedBills = [];

    // Process each bill from the request
    for (const billData of bills) {
      const {
        consumerNumber,
        consumerName,
        consumerAddress,
        contactNumber,
        ward,
        adjustmentUnit,
        totalConsumption,
        installationDate,
        tariffDescription,
        meterNumber,
        meterStatus,
        phaseType,
        billingUnit,
        netLoad,
        sanctionedLoad,
        billDate,
        billNo,
        billType,
        billDisplayParameter1 = null,
        billDisplayParameter2 = null,
        billDisplayParameter3 = null,
        billDisplayParameter4 = null,
        monthAndYear,
        previousReadingDate,
        previousReading,
        currentReadingDate,
        currentReading,
        netBillAmount,
        paymentStatus,
        lastReceiptAmount,
        lastReceiptDate,
        promptPaymentDate,
        promptPaymentAmount,
        dueDate,
        netBillAmountWithDPC,
        dueAlert,
      } = billData;

      const validContactNumber = contactNumber || "N/A";
      const duealertvalue = dueAlert || false;

      // Check if consumerNumber exists in the Consumer collection
      const consumerExists = await Consumer.findOne({ consumerNumber });
      const wardname = consumerExists?.ward;

      if (!consumerExists) {
        failedBills.push({
          consumerNo: consumerNumber,
          errorMessage: "The provided consumer number does not exist",
          errorCode: "2002",
          status: "FAILURE",
        });
        continue; // Skip this bill, move to the next one
      }

      await Consumer.findOneAndUpdate(
        { consumerNumber }, // Search by consumerNumber
        { 
          consumerAddress: billData.consumerAddress, // Bill मधून घेऊन अपडेट
          phaseType: billData.phaseType 
        },
        { new: true } // Return updated consumer
      );

      // Check for duplicate bill (same consumerNumber & monthAndYear)
      const duplicateBill = await Bill.findOne({ consumerNumber, monthAndYear });
      if (duplicateBill) {
        failedBills.push({
          consumerNo: consumerNumber,
          errorMessage: "Duplicate meter reading detected for the same month and consumer.",
          errorCode: "2004",
          status: "FAILURE",
        });
        continue; // Skip duplicate bill
      }

      // Create the new (current month) bill
      const bill = new Bill({
        consumerNumber,
        consumerName,
        consumerAddress,
        contactNumber: validContactNumber,
        ward: wardname,
        adjustmentUnit,
        totalConsumption,
        installationDate,
        tariffDescription,
        meterNumber,
        meterStatus,
        phaseType,
        billingUnit,
        netLoad,
        sanctionedLoad,
        billDate,
        billNo,
        billType,
        billDisplayParameter1,
        billDisplayParameter2,
        billDisplayParameter3,
        billDisplayParameter4,
        monthAndYear,
        previousReadingDate,
        previousReading,
        currentReadingDate,
        currentReading,
        netBillAmount,
        paymentStatus,
        lastReceiptAmount,
        lastReceiptDate,
        promptPaymentDate,
        promptPaymentAmount,
        dueDate,
        netBillAmountWithDPC,
        dueAlert: duealertvalue,
      });

      await bill.save();
      createdBills.push({
        consumerNo: bill.consumerNumber,
        monthAndYear: bill.monthAndYear,
        status: "SUCCESS",
      });

      // Dynamic check: Update the previous month's bill
      const prevMonthYear = getPreviousMonthYear(monthAndYear);
      const prevBill = await Bill.findOne({ consumerNumber, monthAndYear: prevMonthYear });
      if (prevBill) {
        if (lastReceiptAmount != null && lastReceiptDate) {
          const amountMatches =
            lastReceiptAmount === prevBill.netBillAmount ||
            lastReceiptAmount === prevBill.netBillAmountWithDPC ||
            lastReceiptAmount === prevBill.promptPaymentAmount;
          if (amountMatches && new Date(prevBill.billDate) < new Date(lastReceiptDate)) {
            prevBill.paymentStatus = "paid";
            await prevBill.save();
          }
        } else {
          // If lastReceiptAmount or lastReceiptDate is missing, mark the previous bill as "unpaid"
          prevBill.paymentStatus = "unpaid";
          await prevBill.save();
        }
      }
    }

    // Send Response with Success & Failure Messages
    const allBills = [...createdBills, ...failedBills];
    res.status(201).json(allBills);
  } catch (error) {
    console.error("Error inserting bills:", error);
    res.status(500).json({
      message: "Failed to create bills",
      error: error.message,
    });
  }
};



exports.dropBillsCollection = async (req, res) => {
  try {
      await mongoose.connection.db.collection("bills").drop();
      res.status(200).json({ message: "Bills collection dropped successfully." });
  } catch (error) {
      console.error("Error dropping bills collection:", error);
      res.status(500).json({ message: "An error occurred while dropping the collection.", error: error.message });
  }
};


exports.addReceipt = async (req,res) => {
    try {
        const {
          receiptNoBillPayment,
           
            } = req.body;
        const newReceipt = new Bill({
          receiptNoBillPayment
         });

        await newReceipt.save();
       
        res.status(201).json({
            message: "Receipt added successfully.",
            receipt:newReceipt,
        });
    } catch (error) {
        console.error('Error adding receipt:', error);
        res.status(500).json({
            message: "An error occurred while adding the receipt.",
            error: error.message,
        });
    }
};



exports.editReceipt = async (req, res) => {
  try {
      const { _id, receiptNoBillPayment } = req.body;

      if (!_id) {
          return res.status(400).json({ message: "Receipt ID (_id) is required." });
      }

      const updatedReceipt = await Bill.findByIdAndUpdate(
          _id,
          { receiptNoBillPayment },
          { new: true } // Return the updated document
      );

      if (!updatedReceipt) {
          return res.status(404).json({ message: "Receipt not found." });
      }

      res.status(200).json({
          message: "Receipt updated successfully.",
          receipt: updatedReceipt,
      });
  } catch (error) {
      console.error('Error updating receipt:', error);
      res.status(500).json({
          message: "An error occurred while updating the receipt.",
          error: error.message,
      });
  }
};


exports.addRemark = async (req,res) => {
 
  try {
      const {
        remark,role
          } = req.body;
      
      const newRemark = new Bill({
        remark,role
       });

      await newRemark.save();
     
      res.status(201).json({
          message: "Remark added successfully.",
          remark:newRemark,
      });
  } catch (error) {
      console.error('Error adding receipt:', error);
      res.status(500).json({
          message: "An error occurred while adding the receipt.",
          error: error.message,
      });
  }
};





// exports.editRemark = async (req, res) => {
//   console.log("role is >>>>>>>>>", req.body.role);
//   try {
//       const { _id, remark, role } = req.body;

//       if (!_id || !role || !remark) {
//           return res.status(400).json({ message: "Receipt ID (_id), role, and remark are required." });
//       }

//       // Find existing bill
//       const existingBill = await Bill.findById(_id);
//       if (!existingBill) {
//           return res.status(404).json({ message: "Receipt not found." });
//       }

//       // If `remarks` array doesn't exist, initialize it
//       existingBill.remarks = existingBill.remarks || [];

//       // Check if the role already exists in remarks
//       const roleIndex = existingBill.remarks.findIndex(r => r.role === role);

//       if (roleIndex !== -1) {
//           // Update existing role remark
//           existingBill.remarks[roleIndex].remark = remark;
//       } else {
//           // Add new remark with role
//           existingBill.remarks.push({ role, remark: remark });
//       }

//       // Save the updated bill with new remarks array
//       await existingBill.save();

//       res.status(200).json({
//           message: "Remark updated successfully.",
//           remarks: existingBill.remarks, // Return updated remarks array
//       });
//   } catch (error) {
//       console.error("Error updating remark:", error);
//       res.status(500).json({
//           message: "An error occurred while updating the remark.",
//           error: error.message,
//       });
//   }
// };





// exports.editRemark = async (req, res) => {
//     console.log("role is >>>>>>>>>", req.body.role);
//     console.log("Id is >>>>>>>>>", req.body._id);

//     try {
//         const { _id, remark, role } = req.body;

//         if (!_id || !role || !remark) {
//             return res.status(400).json({ message: "Bill ID (_id), role, and remark are required." });
//         }

//         // Find the existing bill
//         const existingBill = await Bill.findById(_id);
//         if (!existingBill) {
//             return res.status(404).json({ message: "Bill not found." });
//         }

//         // Ensure `remarks` array exists
//         existingBill.remarks = existingBill.remarks || [];

//         // Check if the role already exists in remarks
//         const existingRemark = existingBill.remarks.find(r => r.role === role);

//         if (existingRemark) {
//             // Update the existing remark for the role
//             existingRemark.remark = remark;
//             existingRemark.date = new Date(); // Update timestamp
//         } else {
//             // Add a new remark for the role
//             existingBill.remarks.push({ 
//                 _id: new mongoose.Types.ObjectId(), 
//                 role, 
//                 remark, 
//                 date: new Date() 
//             });
//         }

//         // Save the updated bill
//         await existingBill.save();

//         res.status(200).json({
//             message: "Remark updated successfully.",
//             remarks: existingBill.remarks, // Return updated remarks array
//         });
//     } catch (error) {
//         console.error("Error updating remark:", error);
//         res.status(500).json({
//             message: "An error occurred while updating the remark.",
//             error: error.message,
//         });
//     }
// };










exports.editRemark = async (req, res) => {
  console.log("role is >>>>>>>>>", req.body.role);
  console.log("Id is >>>>>>>>>", req.body._id);

  try {
      const { _id, remark, role } = req.body;

      if (!_id || !role || !remark) {
          return res.status(400).json({ message: "Bill ID (_id), role, and remark are required." });
      }

      // Find the existing bill
      const existingBill = await Bill.findById(_id);
      if (!existingBill) {
          return res.status(404).json({ message: "Bill not found." });
      }

      // Ensure `remarks` array exists
      existingBill.remarks = existingBill.remarks || [];

      // Check if the role already exists in remarks
      const existingRemark = existingBill.remarks.find(r => r.role === role);

      if (existingRemark) {
          // Update the existing remark for the role
          existingRemark.remark = remark;
          existingRemark.date = new Date(); // Update timestamp
      } else {
          // Add a new remark for the role
          existingBill.remarks.push({ 
              _id: new mongoose.Types.ObjectId(), 
              role, 
              remark, 
              date: new Date() 
          });
      }

      // Save the updated bill
      const updatedBill = await existingBill.save();

      res.status(200).json({
          message: "Remark updated successfully.",
          remarks: updatedBill.remarks, // Return updated remarks array
      });
  } catch (error) {
      console.error("Error updating remark:", error);
      res.status(500).json({
          message: "An error occurred while updating the remark.",
          error: error.message,
      });
  }
};




exports.addBillFromThirdPartyAPI = async (req, res) => {
  try {
    
    const response = await axios.get('http://localhost:8000/thirdpartybills/lightbills');

    if (!response.data || !Array.isArray(response.data)) {
      return res.status(400).json({ message: "Invalid data format received from third-party API" });
    }

    const billsData = response.data;

    for (const billData of billsData) {
      try {
        
        const user = await User.findOne({ cn: billData.consumerNumber });

        const existingBill = await Bill.findOne({ cn: billData.consumerNumber });

        if (existingBill) {
          
          existingBill.currentReadingDate = billData.currentReadingDate;
          existingBill.billDate = billData.billDate;
          existingBill.previousReadingDate = billData.previousReadingDate;
          existingBill.ifPaidByThisDate = billData.ifPaidByThisDate?.date;
          existingBill.ifPaidBefore = billData.ifPaidByThisDate?.amount;
          existingBill.dueDate = billData.dueDate;
          existingBill.ifPaidAfter = billData.ifPaidAfter?.amount;
          existingBill.userId = user._id;  

          await existingBill.save();
        } else {
          
          const newBill = new Bill({
            cn: billData.consumerNumber,
            currentReadingDate: billData.currentReadingDate,
            billDate: billData.billDate,
            previousReadingDate: billData.previousReadingDate,
            ifPaidByThisDate: billData.ifPaidByThisDate?.date,
            ifPaidBefore: billData.ifPaidByThisDate?.amount,
            dueDate: billData.dueDate,
            ifPaidAfter: billData.ifPaidAfter?.amount,
             
          });

          await newBill.save();
        }
      } catch (error) {
        console.error(`Error processing bill for consumerNumber ${billData.consumerNumber}:`, error.message);
      }
    }

    res.status(201).json({ message: "Bills processed successfully from third-party API" });
  } catch (error) {
    console.error("Error fetching data or processing bills:", error.message);
    res.status(500).json({ message: "Error processing bills from third-party API", error: error.message });
  }
};

exports.editBill = async (req, res) => {
  const requesterRole = req?.user?.role;
  if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterRole !=='Executive Engineer' && requesterRole !=='Junior Engineer') { 
    return res.status(403).json({ message: "You don't have authority to edit bill" }); 
  }
  try {
    const billId = req.params.billId;
    const {
      role,
      ward,
      meterNumber,
      netLoad='',
      totalConsumption,
      meterStatus,
      previousReadingDate,
      previousReading,
      currentReadingDate,
      currentReading,
      billDate,
      currentBillAmount,
      totalArrears,
      netBillAmount,
      roundedBillAmount,
      ifPaidByThisDate,
      earlyPaymentAmount,
      ifPaidBefore,
      dueDate,
      ifPaidAfter,
      overdueDate,
      paymentStatus,
      approvedStatus,
      paidAmount,
      pendingAmount,
      receiptNoBillPayment,
      billPaymentDate,
      forwardForGeneration,
    } = req.body;
    if (!billId) {
      return res.status(400).json({ message: 'Please provide bill ID' });
    }
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const meter = await Meter.findOne({ meterNumber });
    if (!meter) {
      return res.status(404).json({ message: 'Meter not found' });
    }
   
    bill.role = role || bill.role;
    bill.ward = ward || bill.ward;
    bill.meterId = meter._id || bill.meterId;
   
bill.netLoad = netLoad || bill.netLoad || ''; 

    bill.totalConsumption = totalConsumption || bill.totalConsumption;
    bill.meterStatus = meterStatus || bill.meterStatus;
    bill.previousReadingDate = previousReadingDate || bill.previousReadingDate;
    bill.previousReading = previousReading || bill.previousReading;
    bill.currentReadingDate = currentReadingDate || bill.currentReadingDate;
    bill.currentReading = currentReading || bill.currentReading;
    bill.billDate = billDate || bill.billDate;
    bill.currentBillAmount = currentBillAmount || bill.currentBillAmount;
    bill.netBillAmount = netBillAmount || bill.netBillAmount;
    bill.roundedBillAmount = roundedBillAmount || bill.roundedBillAmount;
    bill.ifPaidByThisDate = ifPaidByThisDate || bill.ifPaidByThisDate;
    bill.earlyPaymentAmount = earlyPaymentAmount || bill.earlyPaymentAmount;
    bill.ifPaidBefore = ifPaidBefore || bill.ifPaidBefore;
    bill.dueDate = dueDate || bill.dueDate;
    bill.ifPaidAfter = ifPaidAfter || bill.ifPaidAfter;
    bill.overdueDate = overdueDate || bill.overdueDate;
    bill.paymentStatus = paymentStatus || bill.paymentStatus;
    bill.approvedStatus = approvedStatus || bill.approvedStatus;
    bill.paidAmount = paidAmount || bill.paidAmount;
    bill.pendingAmount = pendingAmount || bill.pendingAmount;
    bill.receiptNoBillPayment=receiptNoBillPayment||bill.receiptNoBillPayment,
      bill.billPaymentDate=billPaymentDate||bill.billPaymentDate,
    bill.forwardForGeneration = forwardForGeneration || bill.forwardForGeneration;
    if (paidAmount === roundedBillAmount && pendingAmount === 0 && requesterRole === 'Super Admin') {
      bill.paymentStatus = 'paid';
      bill.approvedStatus = 'Done';
      bill.yesno='Yes';
    }
    if (req.body.password) {
      bill.password = req.body.password;
    } else {
      bill.password = bill.password;
    }
    if (paidAmount === roundedBillAmount && pendingAmount === 0) {
      bill.paymentStatus = 'paid';
      switch (requesterRole) {
        case 'Junior Engineer':
          bill.approvedStatus = 'PendingForExecutiveEngineer';
          bill.paymentStatus = 'paid';
          break;
        case 'Executive Engineer':
          bill.approvedStatus = 'PendingForAdmin';
          bill.paymentStatus = 'paid';
          break;
        case 'Admin':
          bill.approvedStatus = 'PendingForSuperAdmin';
          bill.paymentStatus = 'paid';
          break;
        case 'Super Admin':
          bill.approvedStatus = 'Done';
          bill.paymentStatus = 'paid';
          break;
        default:
          console.error(`Unexpected role: ${requesterRole}`);
          break;
      }
    }else if (paidAmount > 0 && paidAmount < roundedBillAmount) {
      bill.paymentStatus = 'Partial';
      switch (requesterRole) {
        case 'Junior Engineer':
          bill.approvedStatus = 'PendingForExecutiveEngineer';
          bill.paymentStatus = 'Partial';
          break;
        case 'Executive Engineer':
          bill.approvedStatus = 'PendingForAdmin';
          bill.paymentStatus = 'Partial';

          break;
        case 'Admin':
          bill.approvedStatus = 'PendingForSuperAdmin';
          bill.paymentStatus = 'Partial';
          break;
        case 'Super Admin':
          bill.approvedStatus = 'PartialDone';
          bill.paymentStatus = 'Partial';
          break;
        default:
          console.error(`Unexpected role: ${requesterRole}`);
          break;
      }
    } else {
      if (pendingAmount === roundedBillAmount) {
        bill.paymentStatus = 'unpaid';
      } else {
        bill.paymentStatus = 'Pending';
      }
    }
    await bill.save();
    res.status(200).json({ message: 'Bill updated successfully', bill });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update bill' });
  }
};






  exports.getBills = async (req, res) => {
    try {
      const bills = await Bill.find();
      res.status(200).json(bills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

exports.updateBillStatus = async (req, res) => {
  const { id, approvedStatus, paymentStatus, yesno } = req.body;
  
  let totalArrearsval;
  let netBillAmountval;
  let roundedBillAmountval;
  if (!id || !approvedStatus) {
    return res.status(400).json({ message: 'Bill ID and approved status are required' });
  }
  try {
    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
     if (req?.user?.role === 'Super Admin'){
      if(approvedStatus === 'Done' && yesno === 'Yes' && paymentStatus==='paid'){
          totalArrearsval=bill.totalArrears;
          netBillAmountval=bill.netBillAmount;
          roundedBillAmountval=bill.roundedBillAmount;
          
        bill.paymentStatus = 'paid';
        bill.approvedStatus = 'Done';
      }else if(approvedStatus === 'PendingForSuperAdmin' && yesno === 'No'&& paymentStatus==='unpaid'){
        bill.paymentStatus = 'unpaid';
        bill.approvedStatus = 'PendingForSuperAdmin';
      }else if(approvedStatus === 'PartialDone' && yesno === 'Yes'&& paymentStatus==='Partial'){
        bill.paymentStatus = 'unpaid';
        bill.approvedStatus = 'PartialDone';
      }
     }
        else {
      bill.paymentStatus = paymentStatus;
      if (req?.user?.role === 'Executive Engineer' && approvedStatus === 'PendingForAdmin' && yesno === 'No') {
        bill.approvedStatus = 'PendingForExecutiveEngineer';
      } else if (req?.user?.role === 'Junior Engineer' && approvedStatus === 'PendingForExecutiveEngineer' && yesno === 'No') {
        bill.approvedStatus = 'PendingForJuniorEngineer';
        bill.paymentStatus = 'unpaid';
      } else if (req?.user?.role === 'Admin' && yesno === 'Yes') {
        
        bill.approvedStatus = 'PendingForSuperAdmin';
      } else if (req?.user?.role === 'Admin' && yesno === 'No' && approvedStatus === 'PendingForSuperAdmin') {
        bill.approvedStatus = 'PendingForAdmin';
        bill.paymentStatus = 'unpaid';
      } else {
        bill.approvedStatus = approvedStatus;
      }
    }
    await bill.save();
    res.status(200).json({
      message: 'Bill status updated successfully',
      bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to update bill status',
      error: error.message,
    });
  }
};

exports.updateFlagStatus = async (req, res) => {
  const { billId, flagStatus } = req.body;
  try {
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    bill.flagStatus = flagStatus;
    await bill.save();
    res.status(200).json({ message: 'Bill flag status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update bill flag status' });
  }
};
  exports.deleteBill = async (req, res) => {
    const requesterRole = req?.user?.role;
    
    if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterRole !=='Executive Engineer' && requesterRole !=='Junior Engineer') { 
      return res.status(403).json({ message: "You don't have authority to add bill" }); 
    }
    try {
      const billId = req?.params?.billId;
      const bill = await Bill.findByIdAndDelete(billId);
      if (!bill) {
        return res.status(404).send({ message: 'Bill not found' });
      }
      res.send({ message: 'Bill deleted successfully' });
    } catch (error) {
      res.status(400).send({ message: 'Failed to delete bill' });
    }
  };

exports.massUpdateBillStatus = async (req, res) => {
  try {
    const requesterRole = req?.user?.role;
    if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterRole !== 'Executive Engineer' && requesterRole !== 'Junior Engineer') {
      return res.status(403).json({ message: "You don't have authority to approve bills" });
    }
    const { bills } = req.body;
    if (!bills || bills.length === 0) {
      return res.status(400).json({ message: 'No bills provided' });
    }
    const billsToUpdate = await Bill.find({ _id: { $in: bills.map(bill => bill._id) } });
    if (!billsToUpdate || billsToUpdate.length === 0) {
      return res.status(404).json({ message: 'No bills found' });
    }
    await Promise.all(bills.map(async (bill) => {
      let approvedStatus;
      let paymentStatus;
      if (requesterRole === 'Junior Engineer') {
        approvedStatus = 'PendingForExecutiveEngineer';
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      } else if (requesterRole === 'Executive Engineer') {
        approvedStatus = 'PendingForAdmin';
        paymentStatus =bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      } else if (requesterRole === 'Admin') {
        approvedStatus = 'PendingForSuperAdmin';
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      } else if (requesterRole === 'Super Admin') {
        approvedStatus = 'Done';
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      }
      await Bill.findByIdAndUpdate(bill._id, {
        approvedStatus,
        paymentStatus,
        flagStatus: true 
      }, { new: true });
    }));
    res.status(200).json({
      message: 'Bills updated successfully',
    });

  } catch (error) {
    console.error("Error updating bills:", error);
    res.status(500).json({
      message: 'Error updating bills',
    });
  }
};

exports.reverseMassBillStatus = async (req, res) => {
  try {
    const requesterRole = req?.user?.role;
    if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterRole !== 'Executive Engineer' && requesterRole !== 'Junior Engineer') {
      return res.status(403).json({ message: "You don't have the authority to reverse approvals for bills" });
    }
    const { bills } = req.body;
    if (!bills || bills.length === 0) {
      return res.status(400).json({ message: 'No bills provided for reversal' });
    }
    const billsToUpdate = await Bill.find({ _id: { $in: bills.map(bill => bill._id) } });
    if (!billsToUpdate || billsToUpdate.length === 0) {
      return res.status(404).json({ message: 'No bills found for reversal' });
    }
    await Promise.all(bills.map(async (bill) => {
      let approvedStatus;
      let paymentStatus;
      if (requesterRole === 'Super Admin' && bill?.approvedStatus==='Done') {
        approvedStatus = 'PendingForSuperAdmin'; 
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      } else if (requesterRole === 'Admin' && bill?.approvedStatus==='PendingForSuperAdmin') {
        approvedStatus = 'PendingForAdmin'; 
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      } else if (requesterRole === 'Executive Engineer' && bill?.approvedStatus==='PendingForAdmin') {
        approvedStatus = 'PendingForExecutiveEngineer';
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      } else if (requesterRole === 'Junior Engineer' && bill?.approvedStatus==='PendingForExecutiveEngineer') {
        approvedStatus = 'PendingForJuniorEngineer';
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      }
      await Bill.findByIdAndUpdate(bill._id, {
        approvedStatus,
        paymentStatus,
        flagStatus: false 
      }, { new: true });
    }));
    res.status(200).json({
      message: 'Bills reversed successfully',
    });
  } catch (error) {
    console.error("Error reversing bill approvals:", error);
    res.status(500).json({
      message: 'Error reversing bill approvals',
    });
  }
};

