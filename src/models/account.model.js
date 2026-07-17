const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model.js");

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Account must be associated with a user"],
        index:true
    },
    status: {
        type: String,
        enum: {
            values: ["ACTIVE", "FROZEN", "CLOSED"],
            message: "Status can be either ACTIVE, FROZEN or CLOSED",
            
        },
        default: "ACTIVE"
        
    },
    currency: {
        type: String,
        required: [true, "Currency is required for creating account"],
        uppercase: true,
        default: "INR"
    }
}, {
    timestamps: true
})

accountSchema.methods.getBalance = async function() {
    
    const result = await ledgerModel.aggregate([
        {
            $match: { account: this._id }
        },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",
                            { $multiply: ["$amount", -1] }
                        ]
                    }
                }
            }
        }
    ]);
    
    return result.length > 0 ? result[0].balance : 0;
};

// the below is the compound index example
accountSchema.index({ user:1 , status:1})
// Account -- this is the collection name
module.exports = mongoose.model("Account", accountSchema)
