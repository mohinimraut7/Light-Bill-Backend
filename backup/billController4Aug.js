const Bill = require('../models/bill');
const mongoose = require("mongoose");
const User = require('../models/user'); 
const Meter = require('../models/meter'); 
const Consumer = require('../models/consumer'); 
const cron = require("node-cron");
const axios = require('axios');
const Paidbill = require("../models/paidbill"); 

cron.schedule("40 16 * * *", async () => {
 
  try {
    const today = new Date();
    
    today.setDate(today.getDate() + 2); 
    const dueDateString = today.toISOString().split("T")[0];

   
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
    yesterday.setDate(yesterday.getDate() - 1); 
    const oldDueDateString = yesterday.toISOString().split("T")[0];
    const unpaidUpdate = await Bill.updateMany(
      { dueDate: oldDueDateString, dueAlert: true, paymentStatus: { $regex: /^unpaid$/i } },
      { $set: { dueAlert: false } } 
    );
  
    const paidUpdate = await Bill.updateMany(
      { dueAlert: true, paymentStatus: { $regex: /^paid$/i } },
      { $set: { dueAlert: false } } 
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

  
  if (monthIndex === 0) {
    monthIndex = 11; 
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

    
      const consumerExists = await Consumer.findOne({ consumerNumber });
      const wardname = consumerExists?.ward;

      if (!consumerExists) {
        failedBills.push({
          consumerNo: consumerNumber,
          errorMessage: "The provided consumer number does not exist",
          errorCode: "2002",
          status: "FAILURE",
        });
        continue; 
      }

      await Consumer.findOneAndUpdate(
        { consumerNumber }, 
        { 
          consumerAddress: billData.consumerAddress, 
          phaseType: billData.phaseType 
        },
        { new: true } 
      );
     
      const duplicateBill = await Bill.findOne({ consumerNumber, monthAndYear });
      if (duplicateBill) {
        failedBills.push({
          consumerNo: consumerNumber,
          errorMessage: "Duplicate meter reading detected for the same month and consumer.",
          errorCode: "2004",
          status: "FAILURE",
        });
        continue; 
      }

      
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
            prevBill.paidAmount = lastReceiptAmount; 
            prevBill.billPaymentDate = lastReceiptDate; 
            await prevBill.save();
          }
        } else {
          prevBill.paymentStatus = "unpaid";
          await prevBill.save();
        }
      }
    }
 
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



exports.updateBillPaymentStatus = async (req, res) => {
  try {
    const payments = Array.isArray(req.body) ? req.body : [req.body];
    const responseArray = [];

    for (const payment of payments) {
      const { consumerNumber, receiptAmount, receiptDate } = payment;
      
      if (!consumerNumber || receiptAmount == null || !receiptDate) {
        responseArray.push({
          consumerNo: consumerNumber || "UNKNOWN",
          status: "FAILURE",
          errorMessage: "Missing consumerNumber, receiptAmount or receiptDate",
          errorCode: "2001",
        });
        continue;
      }
      
      const consumerExists = await Consumer.exists({ consumerNumber }); 
      if (!consumerExists) {
        responseArray.push({
          consumerNo: consumerNumber,
          status: "FAILURE",
          errorMessage: "The provided consumer number does not exist",
          errorCode: "2002",
        });
        continue;
      }

      const bills = await Bill.find({ consumerNumber }).sort({ billDate: -1 });

      const matchingBill = bills.find(bill => {
        const billDateValid = new Date(bill.billDate) < new Date(receiptDate);
        const amountMatch =
          receiptAmount === bill.netBillAmount ||
          receiptAmount === bill.netBillAmountWithDPC ||
          receiptAmount === bill.promptPaymentAmount;
        const isUnpaid = bill.paymentStatus === 'unpaid';

        return billDateValid && amountMatch && isUnpaid;
      });

      if (!matchingBill) {
        responseArray.push({
          consumerNo: consumerNumber,
          receiptDate,
          status: "FAILURE",
          errorMessage: "No matching unpaid bill found with valid date and amount",
          errorCode: "2003",
        });
        continue;
      }

      // Update bill
      matchingBill.paymentStatus = "paid";
      matchingBill.paidAmount = receiptAmount;
      matchingBill.billPaymentDate = receiptDate;
      await matchingBill.save();

      // Save receipt
      await Paidbill.create({
        consumerNumber,
        receiptAmount,
        receiptDate,
      });

      responseArray.push({
        consumerNo: consumerNumber,
        receiptDate,
        status: "SUCCESS",
      });
    }

    
    res.status(200).json(responseArray);

  } catch (error) {
    console.error("Error in updateBillPaymentStatus:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


cron.schedule("10 18 * * *", async () => {
  console.log("🔄 Running cron job to update paid bills at 3:36 PM...");

  try {
  
    const bills = await Bill.find();

    for (const bill of bills) {
      const prevMonthYear = getPreviousMonthYear(bill.monthAndYear);
      const prevBill = await Bill.findOne({ consumerNumber: bill.consumerNumber, monthAndYear: prevMonthYear });

      if (prevBill && prevBill.paymentStatus !== "paid") {
        if (bill.lastReceiptAmount != null && bill.lastReceiptDate) {
          const amountMatches =
            bill.lastReceiptAmount === prevBill.netBillAmount ||
            bill.lastReceiptAmount === prevBill.netBillAmountWithDPC ||
            bill.lastReceiptAmount === prevBill.promptPaymentAmount;

          if (amountMatches && new Date(prevBill.billDate) < new Date(bill.lastReceiptDate)) {
            prevBill.paymentStatus = "paid";
            prevBill.paidAmount = bill.lastReceiptAmount; 
            prevBill.billPaymentDate = bill.lastReceiptDate; 
            await prevBill.save();
            console.log(`✅ Updated bill for Consumer ${bill.consumerNumber} for ${prevMonthYear}`);
          }
        }
      }
    }

    console.log("✅ Successfully updated all applicable paid bills!");
  } catch (error) {
    console.error("❌ Error updating paid bills:", error);
  }
});


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
          { new: true } 
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
        remark,role,signature
          } = req.body;
      
      const newRemark = new Bill({
        remark,role,signature
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

exports.editRemark = async (req, res) => {
 
  try {
      const { _id, remark, role,signature,ward } = req.body;
    
      const userward=req.body.ward;

   
      if (!_id || !role || !remark) {
          return res.status(400).json({ message: "Bill ID (_id), role, and remark are required." });
      }

      
      const existingBill = await Bill.findById(_id);
      if (!existingBill) {
          return res.status(404).json({ message: "Bill not found." });
      }

     
      existingBill.remarks = existingBill.remarks || [];

    
      const existingRemark = existingBill.remarks.find(r => r.role === role);

      if (existingRemark) {
        
          existingRemark.remark = remark;
          existingRemark.ward = userward;
          existingRemark.signature = signature; 
          existingRemark.date = new Date(); 
      } else {
         
          existingBill.remarks.push({ 
              _id: new mongoose.Types.ObjectId(), 
              role, 
              remark, 
              ward:userward,
              signature,
              date: new Date() 
          });
      }

     
      const updatedBill = await existingBill.save();

      res.status(200).json({
          message: "Remark updated successfully.",
          remarks: updatedBill.remarks, 
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
         
          bill.approvedStatus = 'PendingForAdmin';
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
          bill.approvedStatus = 'PendingForAdmin';
        
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






//   exports.getBills = async (req, res) => {
//     try {
//       const bills = await Bill.find();
//       res.status(200).json(bills);
//     } catch (error) {
//       console.error('Error fetching bills:', error);
//       res.status(500).json({ message: 'Internal Server Error' });
//     }
//   };



// Updated getBills function with pagination support
exports.getBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const selectedMonthYear = req.query.selectedMonthYear;
    const consumerNumber = req.query.consumerNumber;
    const wardName = req.query.wardName;

    // Build search query
    let searchQuery = {};
    
    // Add filters to search query if provided
    if (consumerNumber) {
      searchQuery.consumerNumber = { $regex: consumerNumber, $options: 'i' };
    }

    if (selectedMonthYear) {
      searchQuery.monthAndYear = selectedMonthYear;
    }

    if (wardName) {
      searchQuery.ward = wardName;
    }

    // Get total count for pagination
    const totalBills = await Bill.countDocuments(searchQuery);

    // Fetch bills with pagination
    const bills = await Bill.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalBills / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      bills,
      pagination: {
        currentPage: page,
        totalPages,
        totalBills,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


exports.getBillsOverdue = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const selectedMonthYear = req.query.selectedMonthYear;

    
    let searchQuery = {};
    
    
    if (req.query.consumerNumber) {
      searchQuery.consumerNumber = { $regex: req.query.consumerNumber, $options: 'i' };
    }

   
    if (selectedMonthYear) {
      searchQuery.monthAndYear = selectedMonthYear;
    }

    
    searchQuery.dueDate = { $lt: new Date() }; 
    searchQuery.paymentStatus = 'unpaid'; 

    
    const totalBills = await Bill.countDocuments(searchQuery);

    
    const bills = await Bill.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    
    const totalPages = Math.ceil(totalBills / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      bills,
      pagination: {
        currentPage: page,
        totalPages,
        totalBills,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching overdue bills:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



exports.getBillsWithMeterPurpose = async (req, res) => {
    try {
        const bills = await Bill.find();
        
     
        const consumers = await Consumer.find();

       
        const consumerMap = new Map();
        consumers.forEach(consumer => {
            consumerMap.set(consumer.consumerNumber, consumer.meterPurpose);
        });

      
        const updatedBills = bills.map(bill => {
            if (consumerMap.has(bill.consumerNumber)) {
                return { ...bill.toObject(), meterPurpose: consumerMap.get(bill.consumerNumber) };
            }
            return bill.toObject();
        });

        res.status(200).json(updatedBills);
    } catch (error) {
        console.error('Error fetching bills:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.updateBillStatus = async (req, res) => {
  const { id, approvedStatus, paymentStatus, yesno } = req.body;
  
  
  let netBillAmountval;
 
  if (!id || !approvedStatus) {
    return res.status(400).json({ message: 'Bill ID and approved status are required' });
  }
  try {
    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

     if (req?.user?.role === 'Super Admin'){
      
     }
        else {
      bill.paymentStatus = paymentStatus;
      if (req?.user?.role === 'Executive Engineer' && approvedStatus === 'PendingForAdmin' && yesno === 'No') {
        bill.approvedStatus = 'PendingForExecutiveEngineer';
      } else if (req?.user?.role === 'Junior Engineer' && approvedStatus === 'PendingForExecutiveEngineer' && yesno === 'No') {
        bill.approvedStatus = 'PendingForJuniorEngineer';
        bill.paymentStatus = 'unpaid';
      } else if (req?.user?.role === 'Admin' && yesno === 'Yes') {
       
        bill.approvedStatus = 'PendingForAdmin';
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
    const requesterWard = req?.user?.ward;
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
      if (requesterRole === 'Junior Engineer' && requesterWard !== 'Head Office') {
        approvedStatus = 'PendingForJuniorEngineerHO';
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      }else if (requesterRole === 'Junior Engineer'&& requesterWard === 'Head Office') {
        approvedStatus = 'PendingForExecutiveEngineer';
        paymentStatus =bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      }
      
      else if (requesterRole === 'Executive Engineer') {
        approvedStatus = 'Approved';
        paymentStatus =bill.paymentStatus ? bill.paymentStatus : 'unpaid';
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
      
     if (requesterRole === 'Executive Engineer' && bill?.approvedStatus==='PendingForExecutiveEngineer') {
        approvedStatus = 'PendingForExecutiveEngineer';
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      } 
      else if (requesterRole === 'Junior Engineer' && bill.approvedStatus==='PendingForExecutiveEngineer' && bill.ward === 'Head Office') {
        approvedStatus = 'PendingForJuniorEngineerHO';
        paymentStatus = bill.paymentStatus ? bill.paymentStatus : 'unpaid';
      }
      else if (requesterRole === 'Junior Engineer' && bill?.approvedStatus==='PendingForJuniorEngineerHO') {
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

