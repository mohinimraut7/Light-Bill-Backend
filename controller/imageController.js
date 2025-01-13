const Image = require('../models/imageModel');  


const uploadImage = async (req, res) => {
  
  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ message: 'Please upload exactly two images.' });
  }

  
  const images = req.files.map(file => file.path);

  try {
    
    const imageRecords = await Promise.all(images.map(imagePath => {
      const newImage = new Image({ path: imagePath });
      return newImage.save();  
    }));

    
    res.status(200).json({
      message: 'Images uploaded and saved successfully',
      images: imageRecords 
    });
  } catch (error) {
   
    console.error(error);
    res.status(500).json({ message: 'Server error during image save', error });
  }
};

module.exports = { uploadImage };
