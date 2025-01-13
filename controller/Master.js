const Master=require('../models/master');
exports.addMaster = async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }
    try {
      const requesterRole = req?.user?.role;
      if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin') {
        return res.status(403).json({ message: "You don't have authority to create Master" });
      }
      const masterToCreate = new Master({ name });
      const savedMaster = await masterToCreate.save();
      res.status(201).json({
        message: "Master created successfully",
        Master: savedMaster
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: `Master with name '${name}' already exists` });
      } else {
        console.error(error);
        res.status(500).json({ message: 'Error creating master' });
      }
    }
  }
  exports.getMasters=async(req,res)=>{
    try{
      const masters=await Master.find();
      res.status(200).json(masters);
    }catch(error){
      console.error(error);
      res.status(500).json({message:'Internal Server Error'});
    }
  }
  exports.deleteMaster = async (req, res) => {
    const { master_id } = req.params;
    try {
        const deletedMaster = await Master.findByIdAndDelete(master_id);
        if (!deletedMaster) {
            return res.status(404).json({
                message: "Master not found",
            });
        }
        res.status(200).json({
            message: "Master deleted successfully",
            master: deletedMaster,
        });
    } catch (error) {
        console.error('Error deleting master', error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}