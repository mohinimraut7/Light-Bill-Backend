const Bill = require('../models/bill');
const User = require('../models/user'); 
const Meter = require('../models/meter'); 
const bcrypt=require('bcryptjs');


const axios = require('axios');

exports.addBill = async (req, res) => {
  // ================After===================>>
  console.log("req.body",req.body)
  const requesterRole = req?.user?.role;
  if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterRole !=='Executive Engineer' && requesterRole !=='Junior Engineer') { 
    return res.status(403).json({ message: "You don't have authority to add bill" }); 
  }
  try {
    const {
      consumerNumber,
      consumerName,
      consumerAddress,
      email,
      contactNumber,
      ward,
      adjustmentUnit,
      totalConsumption,
      installationDate,
      tarriffCode,
      tarriffType,
      meterNumber,
      meterStatus,
      phaseType,
      meterPurpose,
      billingUnit,
      netLoad,  
      sanctionedLoad,
      billDate,
      billNo,
      monthAndYear,
      previousReadingDate,
      previousReading,
      currentReadingDate,
      currentReading,
      currentBillAmount,
      totalArrears,
      netBillAmount,
      roundedBillAmount,
      ifPaidByThisDate,
      earlyPaymentAmount,
      ifPaidBefore,
      ifPaidAfter,
      paymentStatus,
      approvedStatus,
      paidAmount,
      pendingAmount,
      billPaymentDate,
      receiptNoBillPayment,
      promptPaymentDate,
      promptPaymentAmount,
      dueDate,
      dueAlert,
      overdueDate,
   
      forwardForGeneration,
    } = req.body;


    let juniorEngineerContactNumber = null;
    if (req.body.ward) {
      try {
               const juniorEngineer = await User.findOne({
          role: 'Junior Engineer',
          ward: req.body.ward,
        });

        
        if (juniorEngineer && juniorEngineer.ward === req.body.ward) {
          
          juniorEngineerContactNumber = juniorEngineer.contactNumber;
        }
      } catch (error) {
        console.error('Error fetching Junior Engineer contact:', error);
      }
    }

    const bill = new Bill({
      consumerNumber,
      consumerName,
      consumerAddress,
      email,
      contactNumber,
      ward,
      adjustmentUnit,
      totalConsumption,
      installationDate,
      tarriffCode,
      tarriffType,
      meterNumber,
      meterStatus,
      phaseType,
      meterPurpose,
      billingUnit,
      netLoad,  
      sanctionedLoad,
      billDate,
      billNo,
      monthAndYear,
      previousReadingDate,
      previousReading,
      currentReadingDate,
      currentReading,
      
      currentBillAmount,
      totalArrears,
      netBillAmount,
      roundedBillAmount,
      ifPaidByThisDate,
      earlyPaymentAmount,
      ifPaidBefore,
     
      ifPaidAfter,
      paymentStatus,
      paidAmount,
      pendingAmount,
      billPaymentDate,
      receiptNoBillPayment,
      promptPaymentDate,
      promptPaymentAmount,
      dueDate,
      dueAlert,
      overdueDate,
      approvedStatus,
      forwardForGeneration,
      juniorEngineerContactNumber,
    });
    if (paidAmount === roundedBillAmount && pendingAmount === 0) {
      bill.paymentStatus = 'Paid';
      switch (requesterRole) {
        case 'Junior Engineer':
          bill.approvedStatus = 'PendingForExecutiveEngineer';
          bill.paymentStatus = 'Paid';
          break;
        case 'Executive Engineer':
          bill.approvedStatus = 'PendingForAdmin';
          bill.paymentStatus = 'Paid';
          break;
        case 'Admin':
          bill.approvedStatus = 'PendingForSuperAdmin';
          bill.paymentStatus = 'Paid';
          break;
        case 'Super Admin':
          bill.approvedStatus = 'Done';
          bill.paymentStatus = 'Paid';
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
        bill.paymentStatus = 'UnPaid';
      } else {
        bill.paymentStatus = 'Pending';
      }
    }
    await bill.save();
    res.status(201).json({
      message: 'Bill created successfully',
      bill,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create bill',
      error: error.message,
    });
  }
};
exports.addBillFromThirdPartyAPI = async (req, res) => {
  try {
    // Fetch data from the third-party API
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
            // userId: user?._id,  
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
    bill.totalArrears = totalArrears || bill.totalArrears;
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
      bill.paymentStatus = 'Paid';
      bill.approvedStatus = 'Done';
      bill.yesno='Yes';
    }
    if (req.body.password) {
      bill.password = req.body.password;
    } else {
      bill.password = bill.password;
    }
    if (paidAmount === roundedBillAmount && pendingAmount === 0) {
      bill.paymentStatus = 'Paid';
      switch (requesterRole) {
        case 'Junior Engineer':
          bill.approvedStatus = 'PendingForExecutiveEngineer';
          bill.paymentStatus = 'Paid';
          break;
        case 'Executive Engineer':
          bill.approvedStatus = 'PendingForAdmin';
          bill.paymentStatus = 'Paid';
          break;
        case 'Admin':
          bill.approvedStatus = 'PendingForSuperAdmin';
          bill.paymentStatus = 'Paid';
          break;
        case 'Super Admin':
          bill.approvedStatus = 'Done';
          bill.paymentStatus = 'Paid';
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
        bill.paymentStatus = 'UnPaid';
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
    
    // const bills = await Bill.find().populate('userId', 'cn,username email contactNumber ward')
    // .populate('meterId','cn meterNumber phaseType tariffType sanctionedLoad installationDate');

    const bills = await Bill.find();
    res.status(200).json(bills);
  } catch (error) {
    
    console.error('Error fetching bills:', error);

    
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateBillStatus = async (req, res) => {
  console.log("req.user.role", req.user.role)
  const { id, approvedStatus, paymentStatus, yesno } = req.body;
  console.log("yesnocheck in backend", id, approvedStatus, paymentStatus, yesno)
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
      if(approvedStatus === 'Done' && yesno === 'Yes' && paymentStatus==='Paid'){
          totalArrearsval=bill.totalArrears;
          netBillAmountval=bill.netBillAmount;
          roundedBillAmountval=bill.roundedBillAmount;
          console.log("testing reverse>>>>>",totalArrearsval,netBillAmountval,roundedBillAmountval)
        bill.paymentStatus = 'Paid';
        bill.approvedStatus = 'Done';
      }else if(approvedStatus === 'PendingForSuperAdmin' && yesno === 'No'&& paymentStatus==='Pending'){
        bill.paymentStatus = 'Pending';
        bill.approvedStatus = 'PendingForSuperAdmin';
      }else if(approvedStatus === 'PartialDone' && yesno === 'Yes'&& paymentStatus==='Partial'){
        bill.paymentStatus = 'Partial';
        bill.approvedStatus = 'PartialDone';
      }
     }
        else {
      bill.paymentStatus = paymentStatus;
      if (req?.user?.role === 'Executive Engineer' && approvedStatus === 'PendingForAdmin' && yesno === 'No') {
        bill.approvedStatus = 'PendingForExecutiveEngineer';
      } else if (req?.user?.role === 'Junior Engineer' && approvedStatus === 'PendingForExecutiveEngineer' && yesno === 'No') {
        bill.approvedStatus = 'PendingForJuniorEngineer';
        bill.paymentStatus = 'UnPaid';
      } else if (req?.user?.role === 'Admin' && yesno === 'Yes') {
        console.log('Updating approvedStatus to PendingForSuperAdmin');
        bill.approvedStatus = 'PendingForSuperAdmin';
      } else if (req?.user?.role === 'Admin' && yesno === 'No' && approvedStatus === 'PendingForSuperAdmin') {
        bill.approvedStatus = 'PendingForAdmin';
        bill.paymentStatus = 'Pending';
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
    console.log("check role",req.user.role)
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
        paymentStatus = 'Pending';
      } else if (requesterRole === 'Executive Engineer') {
        approvedStatus = 'PendingForAdmin';
        paymentStatus = 'Pending';
      } else if (requesterRole === 'Admin') {
        approvedStatus = 'PendingForSuperAdmin';
        paymentStatus = 'Pending';
      } else if (requesterRole === 'Super Admin') {
        approvedStatus = 'Done';
        paymentStatus = 'Paid';
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
        paymentStatus = 'Pending';
      } else if (requesterRole === 'Admin' && bill?.approvedStatus==='PendingForSuperAdmin') {
        approvedStatus = 'PendingForAdmin'; 
        paymentStatus = 'Pending';
      } else if (requesterRole === 'Executive Engineer' && bill?.approvedStatus==='PendingForAdmin') {
        approvedStatus = 'PendingForExecutiveEngineer';
        paymentStatus = 'Pending';
      } else if (requesterRole === 'Junior Engineer' && bill?.approvedStatus==='PendingForExecutiveEngineer') {
        approvedStatus = 'PendingForJuniorEngineer';
        paymentStatus = 'Pending';
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

