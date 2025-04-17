const Role = require('../models/role');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// exports.addRole = async (req, res) => {
//     const { name,email,ward } = req.body;
//     const requesterRole = req?.user?.role;
//     if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin') {
//         return res.status(403).json({ message: "You don't have authority to add user" });
//     }
//     try {
        
//         const existingRole = await Role.findOne({ name, email, ward });
//         if (existingRole) {
//             return res.status(400).json({
//                 message: "Role is already exists"
                
//             });
//         }


//         let user = await User.findOne({ email });
//         if (!user) {
//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);
//             user = new User({
               
               
//                 role: name,
              
//             });
//             await user.save();
//         } else {
//             await User.findByIdAndUpdate(
//                 user._id,
//                 {username,email, contactNumber, password, ward, role: name },
//                 { new: true, runValidators: true }
//             );
//         }
//         const newRole = new Role({
//             userId: user._id,
//             name,
           
//             email,
           
//             ward
//         });
//         const savedRole = await newRole.save();
//         res.status(201).json({
//             message: "Role added successfully",
//             Role: savedRole
//         });
//     } catch (error) {
//         console.error('Error adding role', error);
//         res.status(500).json({
//             message: 'Internal Server Error'
//         });
//     }
// };



exports.addRole = async (req, res) => {
    const { name, email, ward } = req.body; // फक्त आवश्यक फील्ड्स घेतल

    console.log("name, email, ward",name, email, ward)
    const requesterRole = req?.user?.role;

    if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterRole === 'Executive Engineer' &&
        (requesterRole === 'Junior Engineer' && requesterWard === 'Head Office')) {
        return res.status(403).json({ message: "You don't have authority to add user" });
    }

    try {

        if (name === "Admin") {
            const adminCount = await User.countDocuments({ role: "Admin" });
            if (adminCount >= 2) {
                return res.status(400).json({ message: "A maximum of 2 Admins are allowed." });
            }
        }
        // Role आधीपासून अस्तित्वात आहे का ते तपासा

  // ✅ `requesterRole !== 'Junior Engineer'` आणि `ward` आधीच अस्तित्वात असल्यास, भूमिका तयार होऊ नये
//   if (requesterRole !== 'Junior Engineer') {
//     const existingWard = await Role.findOne({ ward });
//     if (existingWard) {
//         return res.status(400).json({ message: `A role for ward ${ward} already exists` });
//     }
// }
// --------------------------------------------------------------------------------------
// if (requesterRole !== 'Junior Engineer') {
//    console.log("requesterRole",requesterRole)
//     if (name === 'Lipik') {
//         console.log("Inside")
//         const existingLipikWard = await Role.findOne({ ward,name: 'Lipik' });
//         if (existingLipikWard) {
//             return res.status(400).json({ message: `A Lipik for ${ward} already exists for this Lipik` });
//         }
//     } else {
//         const existingWard = await Role.findOne({ ward });
//         if (existingWard) {
//             return res.status(400).json({ message: `A role for ward ${ward} already exists` });
//         }
//     }
// }

if (requesterRole !== 'Junior Engineer') {
    console.log("requesterRole", requesterRole);

    if (name === 'Lipik') {
        console.log("Inside Lipik");
        const existingLipikWard = await Role.findOne({ ward, name: 'Lipik' });
        if (existingLipikWard) {
            return res.status(400).json({ message: `A Lipik for ${ward} already exists for this ward` });
        }
    } 
    else if (name === 'Accountant') {
        console.log("Inside Accountant");
        const existingAccountantWard = await Role.findOne({ ward, name: 'Accountant' });
        if (existingAccountantWard) {
            return res.status(400).json({ message: `An Accountant for ${ward} already exists for this ward` });
        }
    } 
    else if (name === 'Assistant Municipal Commissioner') {
        console.log("Inside Assistant Municipal Commissioner");
        const existingAMCWard = await Role.findOne({ ward, name: 'Assistant Municipal Commissioner' });
        if (existingAMCWard) {
            return res.status(400).json({ message: `An Assistant Municipal Commissioner for ${ward} already exists for this ward` });
        }
    } 
    else if (name === 'Dy.Municipal Commissioner') {
        console.log("Inside Dy.Municipal Commissioner");
        const existingDMCWard = await Role.findOne({ ward, name: 'Dy.Municipal Commissioner' });
        if (existingDMCWard) {
            return res.status(400).json({ message: `An Dy.Municipal Commissioner for ${ward} already exists for this ward` });
        }
    } 
    else {
        const existingWard = await Role.findOne({ ward });
        if (existingWard) {
            return res.status(400).json({ message: `A role for ward ${ward} already exists` });
        }
    }
}


        const existingRole = await Role.findOne({ name, email, ward });
        if (existingRole) {
            return res.status(400).json({
                message: "Role already exists"
            });
        }

        let user = await User.findOne({ email });

        // जर `User` सापडला, तर फक्त त्याचा Role अपडेट करा
        if (user) {
            await User.findByIdAndUpdate(
                user._id,
                { role: name,ward:ward },  // फक्त Role अपडेट
                { new: true, runValidators: true }
            );
        } else {
            return res.status(400).json({
                message: "User not found. Please register the user first."
            });
        }

        // नवीन Role तयार करा
        const newRole = new Role({
            userId: user._id,
            name,  // `name` म्हणजे Role चे नाव
            email,
            ward
        });

        const savedRole = await newRole.save();

        res.status(201).json({
            message: "Role added successfully",
            Role: savedRole
        });
    } catch (error) {
        console.error('Error adding role', error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};


// exports.editRole = async (req, res) => {
//     const { role_id } = req.params;
//     const { name,email,ward } = req.body;
//     const requesterRole = req?.user?.role;
//     if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin') {
//         return res.status(403).json({ message: "You don't have authority to edit role" });
//     }
//     if (!name) {
//         return res.status(400).json({
//             message: "Role name is required",
//         });
//     }
//     try {
//         const roleUpdateData = { name,email,ward };
//         const updatedRole = await Role.findByIdAndUpdate(
//             role_id,
//             roleUpdateData,
//             { new: true, runValidators: true }
//         );
//         if (!updatedRole) {
//             return res.status(404).json({
//                 message: "Role not found",
//             });
//         }
//         let user = await User.findOne({
//             $or: [
//                 { email },
//                 { _id: updatedRole.userId }
//             ]
//         });

//         if (!user) {
//             if (!password) {
//                 return res.status(400).json({
//                     message: "Password is required to create a new user",
//                 });
//             }
//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);
//             user = new User({
//                 role: name,
//             });
//             await user.save();
//         } else {
//             const userUpdateData = { role: name, ward };
//             // if (firstName) userUpdateData.firstName = firstName;
//             if (username) userUpdateData.username = username;
//             if (email) userUpdateData.email = email;
//             if (contactNumber) userUpdateData.contactNumber = contactNumber;
//             if (password) {
//                 const salt = await bcrypt.genSalt(10);
//                 userUpdateData.password = await bcrypt.hash(password, salt);
//             }
//             await User.findByIdAndUpdate(user._id, userUpdateData, { new: true, runValidators: true });
//         }
//         res.status(200).json({
//             message: "Role updated successfully",
//             role: updatedRole,
//         });
//     } catch (error) {
//         console.error('Error updating role', error);
//         res.status(500).json({
//             message: "Internal Server Error"
//         });
//     }
// };



exports.editRole = async (req, res) => {
    const { role_id } = req.params;
    const { name, email, ward } = req.body;
    const requesterRole = req?.user?.role;

    if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin') {
        return res.status(403).json({ message: "You don't have authority to edit role" });
    }

    if (!name) {
        return res.status(400).json({
            message: "Role name is required",
        });
    }

    try {
        // Role अपडेट करणे
        const updatedRole = await Role.findByIdAndUpdate(
            role_id,
            { name, email, ward },
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            return res.status(404).json({
                message: "Role not found",
            });
        }

        // User सापडतोय का तपासा
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found. Please register the user first.",
            });
        }

        // User मध्ये फक्त `role` आणि `ward` अपडेट करा
        await User.findByIdAndUpdate(
            user._id,
            { role: name, ward },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Role updated successfully",
            role: updatedRole,
        });
    } catch (error) {
        console.error('Error updating role', error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// exports.deleteRole = async (req, res) => {
//     const { role_id } = req.params;
//     try {
//         const deletedRole = await Role.findByIdAndDelete(role_id);
//         if (!deletedRole) {
//             return res.status(404).json({
//                 message: "Role not found",
//             });
//         }
//         const user = await User.findById(deletedRole.userId);
//         if (user) {
//             await User.findByIdAndDelete(user._id);
//         }
//         res.status(200).json({
//             message: "Role and associated user deleted successfully",
//             role: deletedRole,
//             userId: deletedRole.userId, 
//         });
//     } catch (error) {
//         console.error('Error deleting role', error);
//         res.status(500).json({
//             message: "Internal Server Error"
//         });
//     }
// };

// ===============================================================
// exports.deleteRole = async (req, res) => {
//     const { role_id } = req.params;
    
//     try {
//         const deletedRole = await Role.findByIdAndDelete(role_id);

//         if (!deletedRole) {
//             return res.status(404).json({
//                 message: "Role not found",
//             });
//         }

         

//         // User सापडतोय का ते तपासा
//         const user = await User.findOne({ email: deletedRole.email });

//         if (user) {
//             // User मधून फक्त Role रिकामा करायचा
//             await User.findByIdAndUpdate(
//                 user._id,
//                 { role: "" },  // फक्त Role काढून टाका, User डिलीट करू नका
//                 { new: true, runValidators: true }
//             );
//         }

//         res.status(200).json({
//             message: "Role deleted successfully, user role removed",
//             role: deletedRole,
//             userId: deletedRole.userId,
//         });

//     } catch (error) {
//         console.error('Error deleting role', error);
//         res.status(500).json({
//             message: "Internal Server Error"
//         });
//     }
// };
// ----------------------------------------------------------------------
exports.deleteRole = async (req, res) => {
    const { role_id } = req.params;
    
    try {
        // Find the role before deleting
        const deletedRole = await Role.findById(role_id);
        
        if (!deletedRole) {
            return res.status(404).json({
                message: "Role not found",
            });
        }

        // Prevent deletion of the last Admin role
        if (deletedRole.name === "Admin") {
            const adminRoleCount = await Role.countDocuments({ name: "Admin" });

            if (adminRoleCount == 1) {
                return res.status(400).json({ message: "At least one Admin role must exist." });
            }
        }

        // Delete the role from the Role collection
        await Role.findByIdAndDelete(role_id);

        // Find the user associated with the deleted role
        const user = await User.findOne({ email: deletedRole.email });

        if (user) {
            // Remove the role from the user (but don't delete the user)
            await User.findByIdAndUpdate(
                user._id,
                { role: "" },  
                { new: true, runValidators: true }
            );
        }

        res.status(200).json({
            message: "Role deleted successfully, user role removed",
            role: deletedRole,
            userId: deletedRole.userId,
        });

    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};



exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}