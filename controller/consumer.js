const Consumer = require('../models/consumer');
const User = require('../models/user'); 

// async function removeUniqueIndexes() {
//     try {
//         await Consumer.collection.dropIndex("consumerAddress_1");
//         await Consumer.collection.dropIndex("ward_1");
//         console.log("✅ Unique indexes on 'consumerAddress' and 'ward' removed");
//     } catch (err) {
//         console.log("⚠️ Error dropping indexes:", err.message);
//     }
// }

// // Call this function once, then remove it after execution
// removeUniqueIndexes();
exports.addConsumer = async (req, res) => {
    try {
        var { consumerNumber,consumerPlace,consumerAddress,meterPurpose, ward, phaseType  } = req.body;
        consumerNumber = consumerNumber.trim();
        consumerPlace=consumerPlace.trim();
        consumerAddress = consumerAddress.trim();
        ward = ward?.trim(); // Handle undefined case
        phaseType = phaseType?.trim();

      
        const existingConsumer = await Consumer.findOne({
            $or: [
                { consumerNumber },
               
            ],
        });

        if (existingConsumer) {
            if (existingConsumer.consumerNumber === consumerNumber) {
                return res.status(400).json({ message: "Consumer number already exists." });
            }
          
        }

        if (!consumerNumber || consumerNumber.length !== 12) {
            return res.status(400).json({ message: "Consumer Number must be exactly 12 digits long" });
        }

        const newConsumer = new Consumer({
            consumerNumber,
            consumerPlace,
            consumerAddress,
           ward,
            meterPurpose,
            phaseType,
    
            
        });

        await newConsumer.save();
       
        res.status(201).json({
            message: "Consumer added successfully.",
            consumer:newConsumer,
        });
    } catch (error) {
        console.error('Error adding consumer:', error);
        res.status(500).json({
            message: "An error occurred while adding the consumer.",
            error: error.message,
        });
    }
};


exports.deleteAll=async(req,res)=>{
    try {
        
        const result = await Consumer.deleteMany({});
        
        if (result.deletedCount > 0) {
            res.status(200).json({
                message: 'All consumers deleted successfully',
                deletedCount: result.deletedCount
            });
        } else {
            res.status(404).json({
                message: 'No consumers found to delete'
            });
        }
    } catch (error) {
        console.error('Error deleting consumers:', error);
        res.status(500).json({
            message: 'Error deleting consumers',
            error: error.message
        });
    } 
}

exports.importExcel=async(req,res)=>{
try {
    const consumers = req.body;
    const insertedConsumers = await Consumer.insertMany(consumers, { ordered: false });

    res.status(201).json({
        message: 'Batch imported successfully',
        count: insertedConsumers.length,
    });
} catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({
        message: 'Error importing data',
        error: error.message,
    });
}
}
exports.getConsumers = async (req, res) => {
    try {
        const consumers = await Consumer.find();
        res.status(200).json(consumers);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}


exports.deleteConsumer = async (req, res) => {
    const { consumer_id } = req.params;
    try {
        const deletedConsumer = await Consumer.findByIdAndDelete(consumer_id);
        if (!deletedConsumer) {
            return res.status(404).json({
                message: "Consumer not found",
            });
        }
        res.status(200).json({
            message: "Consumer deleted successfully",
            consumer: deletedConsumer,
        });
    } catch (error) {
        console.error('Error deleting consumer', error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}




exports.editConsumer = async (req, res) => {
    const {consumerid } = req.params;
    
    const {
        consumerNumber,
        consumerPlace,
        consumerAddress,
        ward,
        meterPurpose,
        phaseType,
    } = req.body;

    
    const requesterRole = req?.user?.role;
    // if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin') {
    //     return res.status(403).json({ message: "You don't have authority to edit meter details" });
    // }

    try {
        
        const consumerUpdateData = {
            ...(consumerNumber && { consumerNumber }),
            ...(consumerPlace && { consumerPlace }),
            ...(consumerAddress && { consumerAddress }),
            ...(ward && { ward }),
            ...(meterPurpose && { meterPurpose }),
            ...(phaseType && { phaseType }),
            
        };

        
        const updatedConsumer = await Consumer.findByIdAndUpdate(
            consumerid,
            consumerUpdateData,
            { new: true, runValidators: true }
        );

        if (!updatedConsumer) {
            return res.status(404).json({
                message: "Consumer not found",
            });
        }

        
        res.status(200).json({
            message: "Consumer updated successfully",
            consumer: updatedConsumer,
        });
    } catch (error) {
        console.error('Error updating consumer:', error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
