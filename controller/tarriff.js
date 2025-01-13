const Tarriff = require('../models/tarriff');
const User = require('../models/user');
const bcrypt = require('bcryptjs');


exports.addTarriff = async (req,res) => {
    try {
        const {
            tarriffCode,
            tarriffType,
            } = req.body;
        const newTarriff = new Tarriff({
            tarriffCode,
            tarriffType,
         });

        await newTarriff.save();
       
        res.status(201).json({
            message: "Tarriff added successfully.",
            tarriff: newTarriff,
        });
    } catch (error) {
        console.error('Error adding tarriff:', error);
        res.status(500).json({
            message: "An error occurred while adding the tarriff.",
            error: error.message,
        });
    }
};


exports.getTarriffs = async (req, res) => {
    try {
        const tarriffs = await Tarriff.find();
        res.status(200).json(tarriffs);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}


exports.deleteTarriff = async (req, res) => {
    const { tarriff_id } = req.params;
    try {
       
        const deletedTarriff = await Tarriff.findByIdAndDelete(tarriff_id);

        
        if (!deletedTarriff) {
            return res.status(404).json({
                message: "Tarriff not found",
            });
        }


        res.status(200).json({
            message: "Tarriff deleted successfully",
            tarriff: deletedTarriff,
         });
    } catch (error) {
        console.error('Error deleting tarriff', error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


exports.editTarriff = async (req, res) => {
    const { tarriff_id } = req.params;
    const { tarriffCode,tarriffType} = req.body;
        try {
        const tarriffUpdateData = {  tarriffCode,tarriffType };
        const updatedTarriff = await Tarriff.findByIdAndUpdate(
           tarriff_id,
           tarriffUpdateData,
            { new: true, runValidators: true }
        );
        if (!updatedTarriff) {
            return res.status(404).json({
                message: "Tarriff not found",
            });
        }
            
        res.status(200).json({
            message: "Tarriff updated successfully",
            tarriff: updatedTarriff,
        });
    } catch (error) {
        console.error('Error updating tarriff', error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};