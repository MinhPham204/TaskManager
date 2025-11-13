const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
    name: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    profileImageUrl: {type: String, default: null},
    role: {type: String, enum: ["admin", "user"], default: "user"},
    team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: false
        },
    },
    {timestamps:true}
);

module.exports = mongoose.model("User", UserSchema);