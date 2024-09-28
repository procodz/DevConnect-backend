const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middleweres/auth");
const User = require("../models/user");
const bcrypt = require("bcrypt");

//Profile API
profileRouter.post("/profile", userAuth, async (req,res) => {
    try{
        const user = req.user;
        res.send(user);

    }
    catch(err){
        res.status(404).send("ERROR" + err.message);
    }
});

//delete a user from DB
profileRouter.delete("/user", async (req,res) =>{
    const userId = req.body.userId;
    try{
        const user = await User.findOneAndDelete(userId);
        res.send("user deleted successfully");
    }
    catch (err){
        res.status(404).send("ERROR " + err.message);
    }
});

//Update the data in DB
profileRouter.patch("/user/:userId", async (req,res) => {
    const userId = req.params?.userId;
    const data = req.body;
    
    try{
      const Allowed_Update = ["age", "gender", "skills"];
      const isUpdateAllowed = Object.keys(data).every((k) => Allowed_Update.includes(k));// loop through all the data(req.body) and checks if allowed field includes data(req.body)
      if(!isUpdateAllowed){
          throw new Error("Invalid Update...");
      }
      const updatedUser = await User.findByIdAndUpdate({_id: userId}, data, {
          runValidators: true,
      });
      res.send("user data updated successfully...");
      
    }
    catch (err){
      res.status(404).send("ERROR " + err.message);
    }
  });

  profileRouter.post("/logout", (req,res) => {
    res.cookie("token", null, {           //setting token value to null this will delete the cookie and u will be logged out.
        expires: new Date(Date.now())
    }).send('you have been loged out successfully!');
  })

  profileRouter.patch("/forgetPassword", userAuth, async (req,res) => {
    try {
    const user = req.user; //getting user from req
    const currentPass = req.body.currentPass; //input by user
    const newPassword = req.body.newPassword;//input by user
    const checkingPass = await bcrypt.compare(currentPass, user.password);//checking if currentpass is the user pass
    if(!checkingPass){
        throw new Error("Invalid credentials...")
    }
    user.password = await bcrypt.hash(newPassword, 10);//changing current pass to newpass
    await user.save();//saving the data
    res.send("password is succesfully updated.");
}catch(err) {
        res.status(400).send("ERROR: " + err.message);
    }
  });

module.exports = profileRouter;