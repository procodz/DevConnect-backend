const express = require("express");
const connectDB = require("./config/database")
const User = require("./models/user");
const bcrypt = require("bcrypt");
const {validateEmailId} = require("./utils/validate");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
app.use(cookieParser());

//signup API
app.post("/signup", async (req,res) => {
    
    
    try {
        const {firstName, lastName, emailId, password} = req.body;
        const passwordHash = await bcrypt.hash(password,10);
        const user = new User(
            {firstName,
            lastName,
            emailId,
            password: passwordHash,
        }
        );
        await user.save();
        res.send("user added successfully....");
    } catch (err) {
        res.status(400).send("Error saving data to Db" + err.message);
    }
});

//Login API
app.post("/login", async (req,res)=>{
    try{
        const {emailId, password} = req.body;
        validateEmailId(emailId); //first validating email
        const user = await User.findOne({emailId: emailId}); // cheching if this email is there in DB
        if(!user){
            throw new Error("invalid credentials")
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);//comparing entered pass and user hashPass //this fn returns a boolean
        if(isPasswordValid){
            //genrating jwt token
            const token = await jwt.sign({_id: user._id}, "secret@key123&*");
            res.cookie("token", token);//it will send the cookie to user with name token
            res.send("login successfull");//if true login 
        }else{
            throw new Error("ivalid credintials");
        }
    }
    catch(err){
        res.status(404).send("Something went wrong" + err.message);
    }
});

//Profile API
app.post("/profile", async (req,res) => {
    try{
        const cookies = req.cookies; //extracting cookie from user browser
        const { token } = cookies; // taking token from cookie
        const decodedMsg = await jwt.verify(token, "secret@key123&*") // it will verify the token with our secret id which was provided when creating jwt token in login api
        const {_id} = decodedMsg; // taking out _id of decoded msg
        const user = await User.findById(_id); //that id is getting user detail
        if(!user){
            throw new Error("user does not found");
        }
        else{
            res.send(user);
        }

    }
    catch(err){
        res.status(404).send("something went wrong" + err.message);
    }
});

//Feed API - get all the users from the DB
app.get("/feed", async (req,res) =>{
    const userEmail = req.body.emailId; //getting email from body
    try{
        const userDetail = await User.find({emailId: userEmail}); //giving userdetails matching useremail also there is findOne() ==> it only return only one user matching 
        
        if(userDetail.length === 0){ //bcs userDetails would be array object if arrays len is 0 means there is no such user matching this email..
            res.status(404).send("user not found");
        }
        else{
            res.send(userDetail);
        }
    }
    catch (err){
        res.status(404).send("something went wrong");
    }
});
//delete a user from DB
app.delete("/user", async (req,res) =>{
    const userId = req.body.userId;
    try{
        const user = await User.findOneAndDelete(userId);
        res.send("user deleted successfully");
    }
    catch (err){
        res.status(404).send("something went wrong...");
    }
})

//Update the data in DB
app.patch("/user/:userId", async (req,res) => {
  const userId = req.params?.userId;
  const data = req.body;
  
  try{
    const Allowed_Update = ["age", "gender", "skills"];
    const isUpdateAllowed = Object.keys(data).every((k) => Allowed_Update.includes(k));
    if(!isUpdateAllowed){
        throw new Error("Invalid Update...");
    }
    if(data.skills.length > 8){
        throw new Error("skill can not be more than 8...")
    }
    const updatedUser = await User.findByIdAndUpdate({_id: userId}, data, {
        runValidators: true,
    });
    res.send("user data updated successfully...");
    
  }
  catch (err){
    res.status(404).send("Data could not be updated...");
  }
});


connectDB().then(() => {
    console.log("DB connected");
    app.listen(3000,() => {
        console.log("Listening server 3000.....");
    })
}).catch((err) =>{
    console.error("DB could not connect...");
});
