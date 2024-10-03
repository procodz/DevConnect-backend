const express = require("express");

const requestRouter = express.Router();

const { userAuth } = require("../middleweres/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const user = require("../models/user");

const USER_SAFE_DATA = "firstName lastName";

//making received requests to a user

requestRouter.get("/user/request/received", userAuth, async(req,res) => {
    try {
        
        const loggedInUser = req.user;
        const connectionRequest = await ConnectionRequest.find({
            toUserId: loggedInUser._id,   //making sure touserId is loggedInUser
            status: "interested", //loggedInUser can only see the request which are interested in him
        }).populate("fromUserId", "firstName lastName"); // populate method is to finding from reference DB which is User in this case 

        res.json({
            messgae: "List of received requests",
            data: connectionRequest,
        })

    } catch (error) {
        res.status(404).send("ERROR : " + error.message);
    }
});

requestRouter.get("/user/connections", userAuth, async (req,res) =>{
    try {
        const loggedInUser = req.user;
        const connectionRequest = await ConnectionRequest.find(
           {$or: [
           { 
            toUserId: loggedInUser._id,
            status: "accepted",
           },
           {
            fromUserId: loggedInUser._id,
            status: "accepted",
        }
        ],
        })
        .populate("fromUserId", USER_SAFE_DATA)
        .populate("toUserId", USER_SAFE_DATA);
        const data = await connectionRequest.map((row) => {
            if(row.fromUserId._id.toString() === loggedInUser._id.toString()){
                return row.toUserId;
            }
            return row.fromUserId;
        });

        res.json({message: "all the connections",
            data,
        });

        
    } catch (error) {
        res.status(404).send("ERROR : " + error.message);
    }
});

requestRouter.get("/feed", userAuth, async (req,res) => {
    try {
        
        const loggedInUser = req.user;
        const page = req.query.page || 1; //take out page no from req
        let limit = req.query.limit || 3; // take out limit from req
        limit = limit > 50 ? 50: limit; // checks that user does not rquest more than 50 user feed
        const skip = (page-1)*limit;

        const connectionRequest = await ConnectionRequest.find({
            $or: [{fromUserId: loggedInUser._id},
                {toUserId: loggedInUser._id}
            ],
        }).select("fromUserId toUserId");

        const hideFromFeed = new Set();
        connectionRequest.forEach((req) =>{
            hideFromFeed.add(req.fromUserId.toString());
            hideFromFeed.add(req.toUserId.toString());
        });

        const user = await User.find({
            $and: [ {_id: {$nin: Array.from(hideFromFeed)}},
                {_id: {$ne: loggedInUser._id}}

            ],
        }).select(USER_SAFE_DATA).skip(skip).limit(limit); //skip() & limit() for pagination
        res.json({dat: user});


    } catch (error) {
        res.status(404).json({message: error.message});
    }
});


module.exports = requestRouter;