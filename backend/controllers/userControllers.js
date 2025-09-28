const Task = require("../models/Task");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getUser = async (req, res) => {
    try{
        const users = await User.find({role: 'user'}).select("-password");

        // Add task counts to each user
        const userWithTaskCounts = await Promise.all(
            users.map(async(user) => {
            const pendingTasks = await Task.countDocuments({assignedTo: user._id, status: "Pending"});  
            const inProgessTasks = await Task.countDocuments({assignedTo: user._id, status: "In Progress"});
            const completedTasks = await Task.countDocuments({assignedTo: user._id, status: "Completed"});

            return {
                ...user._doc,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            };
        }));
        res.json(userWithTaskCounts);
    }catch(error){
        res.status(500).json({message: "Server error", error: error.message});
    }
};


const getUserById = async (req, res) => {
    try{
        const user = await User.findById(req.params.id).select("-password");
        if(!user) return res.status(404).json({message: "User not found"});
        res.json(user);
    }catch(error){
        res.status(500).json({message: "Server error", error: error.message});
    }
};


// const deleteUser = async (req, res) => {
//     try{
//         const userToDelete = await User.find()
//     }catch(error){
//         res.status(500).json({message: "Server error", error: error.message});
//     }
// };

module.exports = {getUser, getUserById};