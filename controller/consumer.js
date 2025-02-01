const Consumer = require('../models/consumer');
const User = require('../models/user'); 

exports.addConsumer = async (req, res) => {
    try {
        const { consumerNumber,consumerAddress,meterPurpose, ward, phaseType  } = req.body;
      
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

        
        const newConsumer = new Consumer({
            consumerNumber,
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


exports.getConsumers = async (req, res) => {
    try {
        const consumers = await consumerNumber.find();
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
    const { consumer_id } = req.params;
    const {
        consumerNumber,
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
            ...(consumerAddress && { consumerAddress }),
            ...(ward && { ward }),
            ...(meterPurpose && { meterPurpose }),
            ...(phaseType && { phaseType }),
            
        };

        
        const updatedConsumer = await Consumer.findByIdAndUpdate(
            consumer_id,
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
