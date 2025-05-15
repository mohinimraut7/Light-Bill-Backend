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

      var validContactNumber = contactNumber || "N/A";
      var duealertvalue = dueAlert || false;


      // 🔹 Check i  f consumerNumber exists in the Consumer collection
      const consumerExists = await Consumer.findOne({ consumerNumber });
      let wardname=consumerExists?.ward;

      if (!consumerExists) {
        failedBills.push({
          consumerNo: consumerNumber,
          errorMessage: "The provided consumer number does not exist",
          errorCode: "2002",
          status: "FAILURE",
        });
        continue; // Skip this bill, move to the next one
      }

      // 🔹 Check for duplicate bill (same consumerNumber & monthAndYear)
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

      // ✅ If consumer exists & no duplicate bill, insert the bill
      const bill = new Bill({
        consumerNumber,
        consumerName,
        consumerAddress,
        contactNumber: validContactNumber,
        ward:wardname,
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
        dueAlert:duealertvalue
      });

      await bill.save();
      createdBills.push({
        consumerNo: bill.consumerNumber,
        monthAndYear: bill.monthAndYear,
        status: "SUCCESS",
      });
    }

    // 🔹 Send Response with Success & Failure Messages
    let allBills = [...createdBills, ...failedBills];
    res.status(201).json(
      
      allBills
    );

  } catch (error) {
    console.error("Error inserting bills:", error);
    res.status(500).json({
      message: "Failed to create bills",
      error: error.message,
    });
  }
};

