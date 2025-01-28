const User = require("../models/user");
const env = require("dotenv");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const user = require("../models/user");
const Bill = require("../models/bill");
const Role = require("../models/role");
const fetch = require('node-fetch');
env.config();
const JWT_SECRET = process.env.JWT_SECRET;

exports.addUser = async (req, res) => {
  const {cn,username, email, password, contactNumber, address, role,ward } = req.body;
 
  try {
    if (!/^\d{10}$/.test(contactNumber.toString())) {
      return res.status(400).json({ message: "Contact number must be a 10-digit number" });
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      cn,
      username,
      email,
      password: hashedPassword,
      contactNumber,
      address,
      role,
      ward
    });
    const savedUser = await newUser.save();
    res.status(201).json({ message: "User added successfully", user: savedUser });
  } catch (error) {
    res.status(400).json({ message: "Error adding user", error });
  }
};

exports.deleteUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const deletedUser = await user.findByIdAndDelete(user_id);
    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    await Bill.deleteMany({ userId: user_id });
    res.status(200).json({
      message: "User and corresponding bills deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}



exports.editProfile = async (req, res) => {
  const { userId } = req.params;

  const {
    cn,username, email, password, contactNumber,
    address, city, country, postalCode, role, roleSupervisor, ward, wardsection, description
  } = req.body;
  const requesterRole = req?.user?.role;
  const requesterId = req?.user?._id;
  if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterId.toString() !== userId) {
    return res.status(403).json({ message: "You don't have authority to edit this user" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.cn = cn || user.cn;
    user.email = email || user.email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    if (contactNumber) {
      if (!/^\d{10}$/.test(contactNumber.toString())) {
        return res.status(400).json({ message: "Contact number must be a 10-digit number" });
      }
      user.contactNumber = contactNumber;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    user.username = username || user.username;
    user.address = address || user.address;
    user.city = city || user.city;
    user.country = country || user.country;
    user.postalCode = postalCode || user.postalCode;
    user.role = role || user.role;
    user.roleSupervisor = roleSupervisor || user.roleSupervisor;
    user.ward = ward || user.ward;
    user.wardsection = wardsection || user.wardsection;
    user.description = description || user.description;
    if (role) {
      user.role = role;
      const userRole = await Role.findOne({ userId: user._id });
      if (userRole) {
        userRole.cn = cn|| userRole.cn;
        userRole.name = role || userRole.name;
        userRole.email = email || userRole.email;
        userRole.contactNumber = contactNumber || userRole.contactNumber;
        userRole.ward = ward || userRole.ward;
        userRole.password = user.password || userRole.password; 
        await userRole.save();

      } else {
        const newRole = new Role({
          cn: user._cn,
          userId: user._id,
          email: email || user.email,
          contactNumber: contactNumber || user.contactNumber,
          ward: ward || user.ward,
          password: user.password, 
          role,
        });
        await newRole.save();
      }
    }

    const updatedUser = await user.save();
    
    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    const { _id,cn,username, email: userEmail, contactNumber, address, ward, role, city, country, postalCode, section, description } = user;
    res.status(200).json({
      message: "Login successful",
      token,
      user: { _id,cn,username, email: userEmail, contactNumber, address, ward, role, city, country, postalCode, section, description }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
}
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
