import addressmodel from "../Model/Addressmodel.js";
export const addAddress = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { fullName, Address, City, postalCode, PhoneNumber } = req.body;

        if (!fullName || !Address || !City || !postalCode || !PhoneNumber) {
            return res.status(400).json({ success: false, message: "All required fields must be provided." });
        }

        if ( postalCode < 100000 || postalCode > 999999) {
            return res.status(400).json({ success: false, message: "Postal Code must be a valid 6-digit number." });
        }
        if (!/^\d{10}$/.test(PhoneNumber)) {
            return res.status(400).json({ success: false, message: "Phone Number must be a valid 10-digit number." });
        }
        const newAddress = new addressmodel({
            userId: userId,
            fullName,
            Address,
            City,
            postalCode: postalCode, 
            PhoneNumber,
        });

        const savedAddress = await newAddress.save();
        res.status(201).json({ 
            success: true, 
            message: "Address added successfully", 
            address: savedAddress 
        });

    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};


export const getAddressesByUserId = async (req, res) => {
    try {
        const userId = req.user.id;

        const addresses = await addressmodel.find({ userId: userId });

        if (addresses.length === 0) {
            return res.status(404).json({ success: false, message: "No addresses found for this user." });
        }

        res.status(200).json({ 
            success: true, 
            count: addresses.length,
            addresses 
        });

    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};


export const updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.id;
        const updateData = req.body;

        // Validate BEFORE updating the database
        if (updateData.postalCode) {
            const postalCode = Number(updateData.postalCode);
            if (postalCode < 100000 || postalCode > 999999) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Postal Code must be a valid 6-digit number." 
                });
            }
        }

        if (updateData.PhoneNumber) {
            if (!/^\d{10}$/.test(updateData.PhoneNumber)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Phone Number must be a valid 10-digit number." 
                });
            }
        }

        // Now update the database after validation passes
        const updatedAddress = await addressmodel.findOneAndUpdate(
            { _id: addressId, userId: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ 
                success: false, 
                message: "Address not found or unauthorized." 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Address updated successfully", 
            address: updatedAddress 
        });

    } catch (error) {
        console.error("Error updating address:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error." 
        });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.id;
        const deletedAddress = await addressmodel.findOneAndDelete({ 
            _id: addressId, 
            userId: userId 
        });

        if (!deletedAddress) {
            return res.status(404).json({ success: false, message: "Address not found or unauthorized." });
        }

        res.status(200).json({ 
            success: true, 
            message: "Address deleted successfully", 
            address: deletedAddress 
        });

    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};


