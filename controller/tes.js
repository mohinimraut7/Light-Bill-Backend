exports.editRole = async (req, res) => {
    const { role_id } = req.params;
    const { name,email, contactNumber, password, ward } = req.body;
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
        const roleUpdateData = { name,email, contactNumber, ward };
        const updatedRole = await Role.findByIdAndUpdate(
            role_id,
            roleUpdateData,
            { new: true, runValidators: true }
        );

        if (!updatedRole) {
            return res.status(404).json({
                message: "Role not found",
            });
        }
        let user = await User.findOne({
            $or: [
                { email },
                { _id: updatedRole.userId }
            ]
        });

        if (!user) {
            if (!password) {
                return res.status(400).json({
                    message: "Password is required to create a new user",
                });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user = new User({
               
                email,
                password: hashedPassword,
                contactNumber,
                role: name,
                ward
            });
            await user.save();
        } else {
            const userUpdateData = { role: name, ward };
           
            if (email) userUpdateData.email = email;
            if (contactNumber) userUpdateData.contactNumber = contactNumber;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                userUpdateData.password = await bcrypt.hash(password, salt);
            }
            await User.findByIdAndUpdate(user._id, userUpdateData, { new: true, runValidators: true });
        }
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
