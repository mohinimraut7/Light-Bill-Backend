const Meter = require('../models/meter');
const User = require('../models/user'); 

exports.addMeter = async (req, res) => {
    try {
        const {
            cn,
            meterNumber,
            meterPurpose,
            phaseType,
            tariffType,
            sanctionedLoad,
            installationDate,
        } = req.body;
    
        const existingUser = await User.findOne({ cn });
        if (!existingUser) {
            return res.status(400).json({ message: "Consumer number does not exist in the User collection." });
        }
        const existingMeter = await Meter.findOne({
            $or: [
                { meterNumber },
                { cn },
            ],
        });

        if (existingMeter) {
            if (existingMeter.meterNumber === meterNumber) {
                return res.status(400).json({ message: "Meter number already exists." });
            }
            if (existingMeter.cn === cn) {
                return res.status(400).json({ message: "Consumer number already has a meter assigned." });
            }
        }

        
        const newMeter = new Meter({
            cn,
            meterNumber,
            meterPurpose,
            phaseType,
            tariffType,
            sanctionedLoad,
            installationDate,
        });

        await newMeter.save();
       
        res.status(201).json({
            message: "Meter added successfully.",
            meter: newMeter,
        });
    } catch (error) {
        console.error('Error adding meter:', error);
        res.status(500).json({
            message: "An error occurred while adding the meter.",
            error: error.message,
        });
    }
};


exports.getMeters = async (req, res) => {
    try {
        const meters = await Meter.find();
        res.status(200).json(meters);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}


exports.deleteMeter = async (req, res) => {
    const { meter_id } = req.params;
    try {
        const deletedMeter = await Meter.findByIdAndDelete(meter_id);
        if (!deletedMeter) {
            return res.status(404).json({
                message: "Meter not found",
            });
        }
        res.status(200).json({
            message: "Meter deleted successfully",
            meter: deletedMeter,
        });
    } catch (error) {
        console.error('Error deleting meter', error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}




exports.editMeter = async (req, res) => {
    const { meter_id } = req.params;
    const {
        cn,
        meterNumber,
        meterPurpose,
        phaseType,
        tariffType,
        sanctionedLoad,
        installationDate,
    } = req.body;

    
    const requesterRole = req?.user?.role;
    
    try {
        
        const meterUpdateData = {
            ...(cn && { cn }),
            ...(meterNumber && { meterNumber }),
            ...(meterPurpose && { meterPurpose }),
            ...(phaseType && { phaseType }),
            ...(tariffType && { tariffType }),
        };

        
        const updatedMeter = await Meter.findByIdAndUpdate(
            meter_id,
            meterUpdateData,
            { new: true, runValidators: true }
        );

        if (!updatedMeter) {
            return res.status(404).json({
                message: "Meter not found",
            });
        }

        
        res.status(200).json({
            message: "Meter updated successfully",
            meter: updatedMeter,
        });
    } catch (error) {
        console.error('Error updating meter:', error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
