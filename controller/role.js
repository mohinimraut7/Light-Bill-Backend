// const Role = require('../models/role');
// const User = require('../models/user');
// const bcrypt = require('bcryptjs');




// exports.addRole = async (req, res) => {
//     const { name, email, ward } = req.body; 

//     console.log("name, email, ward",name, email, ward)
//     const requesterRole = req?.user?.role;

//     if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && requesterRole === 'Executive Engineer' &&
//         (requesterRole === 'Junior Engineer' && requesterWard === 'Head Office')) {
//         return res.status(403).json({ message: "You don't have authority to add user" });
//     }

//     try {

//         if (name === "Admin") {
//             const adminCount = await User.countDocuments({ role: "Admin" });
//             if (adminCount >= 2) {
//                 return res.status(400).json({ message: "A maximum of 2 Admins are allowed." });
//             }
//         }
        

// if (requesterRole !== 'Junior Engineer') {
//     console.log("requesterRole", requesterRole);

//     if (name === 'Lipik') {
//         console.log("Inside Lipik");
//         const existingLipikWard = await Role.findOne({ ward, name: 'Lipik' });
//         if (existingLipikWard) {
//             return res.status(400).json({ message: `A Lipik for ${ward} already exists for this ward` });
//         }
//     } 
//     else if (name === 'Accountant') {
//         console.log("Inside Accountant");
//         const existingAccountantWard = await Role.findOne({ ward, name: 'Accountant' });
//         if (existingAccountantWard) {
//             return res.status(400).json({ message: `An Accountant for ${ward} already exists for this ward` });
//         }
//     } 
//     else if (name === 'Assistant Municipal Commissioner') {
//         console.log("Inside Assistant Municipal Commissioner");
//         const existingAMCWard = await Role.findOne({ ward, name: 'Assistant Municipal Commissioner' });
//         if (existingAMCWard) {
//             return res.status(400).json({ message: `An Assistant Municipal Commissioner for ${ward} already exists for this ward` });
//         }
//     } 
//     else if (name === 'Dy.Municipal Commissioner') {
//         console.log("Inside Dy.Municipal Commissioner");
//         const existingDMCWard = await Role.findOne({ ward, name: 'Dy.Municipal Commissioner' });
//         if (existingDMCWard) {
//             return res.status(400).json({ message: `An Dy.Municipal Commissioner for ${ward} already exists for this ward` });
//         }
//     } 
//     // else {
//     //     const existingWard = await Role.findOne({ ward });
//     //     if (existingWard) {
//     //         return res.status(400).json({ message: `A role for ward ${ward} already exists` });
//     //     }
//     // }

//     else {
//         const existingWard = await Role.findOne({ ward });
      
//         const allowOverride =
//           requesterRole === 'Admin' ||
//           requesterRole === 'Executive Engineer' ||
//           requesterRole === 'Super Admin' ||
//           (requesterRole === 'Junior Engineer' && requesterWard === 'Head Office');
      
//         if (existingWard && !allowOverride) {
//           return res.status(400).json({ message: `A role for ward ${ward} already exists` });
//         }
//       }
      
    
// }


//         const existingRole = await Role.findOne({ name, email, ward });
//         if (existingRole) {
//             return res.status(400).json({
//                 message: "Role already exists"
//             });
//         }

//         let user = await User.findOne({ email });

       
//         if (user) {
//             await User.findByIdAndUpdate(
//                 user._id,
//                 { role: name,ward:ward },  
//                 { new: true, runValidators: true }
//             );
//         } else {
//             return res.status(400).json({
//                 message: "User not found. Please register the user first."
//             });
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





// exports.editRole = async (req, res) => {
//     const { role_id } = req.params;
//     const { name, email, ward } = req.body;
//     const requesterRole = req?.user?.role;
//     const requesterWard = req?.user?.ward;

//     if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && !(requesterRole === 'Junior Engineer' && requesterWard === 'Head Office')) {
//         return res.status(403).json({ message: "You don't have authority to edit role" });
//     }

//     if (!name) {
//         return res.status(400).json({
//             message: "Role name is required",
//         });
//     }

//     try {
      
//         const updatedRole = await Role.findByIdAndUpdate(
//             role_id,
//             { name, email, ward },
//             { new: true, runValidators: true }
//         );

//         if (!updatedRole) {
//             return res.status(404).json({
//                 message: "Role not found",
//             });
//         }

        
//         let user = await User.findOne({ email });

//         if (!user) {
//             return res.status(400).json({
//                 message: "User not found. Please register the user first.",
//             });
//         }

       
//         await User.findByIdAndUpdate(
//             user._id,
//             { role: name, ward },
//             { new: true, runValidators: true }
//         );

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





// exports.deleteRole = async (req, res) => {
//     const { role_id } = req.params;
    
//     try {
        
//         const deletedRole = await Role.findById(role_id);
        
//         if (!deletedRole) {
//             return res.status(404).json({
//                 message: "Role not found",
//             });
//         }

       
//         if (deletedRole.name === "Admin") {
//             const adminRoleCount = await Role.countDocuments({ name: "Admin" });

//             if (adminRoleCount == 1) {
//                 return res.status(400).json({ message: "At least one Admin role must exist." });
//             }
//         }

       
//         await Role.findByIdAndDelete(role_id);

       
//         const user = await User.findOne({ email: deletedRole.email });

//         if (user) {
           
//             await User.findByIdAndUpdate(
//                 user._id,
//                 { role: "" },  
//                 { new: true, runValidators: true }
//             );
//         }

//         res.status(200).json({
//             message: "Role deleted successfully, user role removed",
//             role: deletedRole,
//             userId: deletedRole.userId,
//         });

//     } catch (error) {
//         console.error('Error deleting role:', error);
//         res.status(500).json({
//             message: "Internal Server Error"
//         });
//     }
// };



// exports.getRoles = async (req, res) => {
//     try {
//         const roles = await Role.find();
//         res.status(200).json(roles);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             message: 'Internal Server Error'
//         });
//     }
// }



const Role = require('../models/role');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// 23-Oct-2026: Head Office "Clerk" दोन विभागांसाठी (Electrical / Accounts). बाकी roles ना विभाग नाही.
const CLERK_DEPARTMENTS = ['Electrical', 'Accounts'];
const resolveDepartment = (name, department) => {
    if (name !== 'Clerk') return { ok: true, value: undefined };
    if (!CLERK_DEPARTMENTS.includes(department)) {
        return { ok: false, message: `Clerk साठी Department निवडा (${CLERK_DEPARTMENTS.join(' / ')})` };
    }
    return { ok: true, value: department };
};




exports.addRole = async (req, res) => {
    const { name, email, ward } = req.body; 
    const dept = resolveDepartment(name, req.body.department); // 23-Oct-2026
    if (!dept.ok) {
        return res.status(400).json({ message: dept.message });
    }

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
    // else {
    //     const existingWard = await Role.findOne({ ward });
    //     if (existingWard) {
    //         return res.status(400).json({ message: `A role for ward ${ward} already exists` });
    //     }
    // }

    else {
        const existingWard = await Role.findOne({ ward });
      
        const allowOverride =
          requesterRole === 'Admin' ||
          requesterRole === 'Executive Engineer' ||
          requesterRole === 'Super Admin' ||
          (requesterRole === 'Junior Engineer' && requesterWard === 'Head Office');
      
        if (existingWard && !allowOverride) {
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

       
        if (user) {
            await User.findByIdAndUpdate(
                user._id,
                // { role: name,ward:ward },  
                { role: name, ward: ward, department: dept.value }, // 23-Oct-2026: department (Clerk)
                { new: true, runValidators: true }
            );
        } else {
            return res.status(400).json({
                message: "User not found. Please register the user first."
            });
        }

       
        const newRole = new Role({
            userId: user._id,
            name, 
            email,
            ward,
            department: dept.value // 23-Oct-2026
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





exports.editRole = async (req, res) => {
    const { role_id } = req.params;
    const { name, email, ward } = req.body;
    const requesterRole = req?.user?.role;
    const requesterWard = req?.user?.ward;
    const dept = resolveDepartment(name, req.body.department); // 23-Oct-2026
    if (!dept.ok) {
        return res.status(400).json({ message: dept.message });
    }

    if (requesterRole !== 'Super Admin' && requesterRole !== 'Admin' && !(requesterRole === 'Junior Engineer' && requesterWard === 'Head Office')) {
        return res.status(403).json({ message: "You don't have authority to edit role" });
    }

    if (!name) {
        return res.status(400).json({
            message: "Role name is required",
        });
    }

    try {
      
        const updatedRole = await Role.findByIdAndUpdate(
            role_id,
            // { name, email, ward },
            // 23-Oct-2026: Clerk नसेल तर department काढून टाकतो
            dept.value ? { name, email, ward, department: dept.value } : { name, email, ward, $unset: { department: 1 } },
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            return res.status(404).json({
                message: "Role not found",
            });
        }

        
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User not found. Please register the user first.",
            });
        }

       
        await User.findByIdAndUpdate(
            user._id,
            // { role: name, ward },
            dept.value ? { role: name, ward, department: dept.value } : { role: name, ward, $unset: { department: 1 } },
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





exports.deleteRole = async (req, res) => {
    const { role_id } = req.params;
    
    try {
        
        const deletedRole = await Role.findById(role_id);
        
        if (!deletedRole) {
            return res.status(404).json({
                message: "Role not found",
            });
        }

       
        if (deletedRole.name === "Admin") {
            const adminRoleCount = await Role.countDocuments({ name: "Admin" });

            if (adminRoleCount == 1) {
                return res.status(400).json({ message: "At least one Admin role must exist." });
            }
        }

       
        await Role.findByIdAndDelete(role_id);

       
        const user = await User.findOne({ email: deletedRole.email });

        if (user) {
           
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