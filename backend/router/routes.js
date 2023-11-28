const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const router = express.Router()


require("../db/connnection");
const User = require('../model/userSchema');
const Campaign = require('../model/campaignSchema');
const authenticate = require('../middleware/authenticate');

router.get('/' , (req,res) => {
    res.send("Backend Home Page");
    // res.setHeader("Access-Control-Allow-Origin", "*")
    // res.setHeader("Access-Control-Allow-Credentials", "true");
    // res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    // res.setHeader("Access-Control-Allow-Headers", "content-type");
    // res.setHeader( "Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS" ); 
})

router.get('/viewAllUsers', (req,res) =>{
    User.find()
        .then((users) =>{
            res.send(users)
        })
        .catch((err) => console.log(err))
})

router.get('/user/:id' , (req,res) => {
    User.findOne({_id: req.params.id})
        .then((user) =>{
            if(user){
                res.status(200).send(user);
            }
        })
        .catch((e)=>{console.log(e)})
})

router.get('/profile' , authenticate , (req,res) => {
    return res.send(req.rootUser);
})

router.get('/allCampaigns' , (req,res) => {
    Campaign.find()
        .then((campaigns) => {
            res.send(campaigns)
        })
        .catch((e)=>{console.log(e)})
})

router.get('/getCampaign/:id' , (req,res) => { 
    Campaign.findOne({_id:req.params.id})
        .then((campaign) => {
            return res.status(200).send(campaign)
        })
        .catch((e)=>{console.log(e)})
})

router.get('/logout' , (req,res) => {
    res.clearCookie("jwtoken", {path: "/" ,domain: 'localhost', httpOnly: true, secure: true, sameSite:"none" });
    res.status(200).json({message:"Logged out Successfully!"})
    console.log(res.cookie)
})

router.post('/getManyCampaigns' , (req,res) => {
    const list = req.body
    let c_list =[]
    // console.log(list[0].campaign.campaign_id)
    list.map((item) =>{
        c_list.push(item.campaign.campaign_id)
    })
    // console.log(c_list)
    Campaign.find({ _id: {$in: c_list}})
        .then((campaigns)=>{
            if(campaigns){
                res.status(200).send(campaigns)
            }
        })
        .catch((e)=>console.log(e))
})

router.post('/register' , (req , res) => {
    const { name , email , pwd , cpwd } = req.body
    
    //validation
    function validateEmail(email) {
        const regex = /^[\w.-]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    if(!validateEmail(email)){
        return res.status(401).json({message: "Invalid Email"})
    }

    //Checking existing User
    User.findOne({email: email})
        .then( (userExist) => {
            if(userExist){
                return res.status(401).json({message: "Email already Exists"})
            }

            else if(pwd != cpwd){
                return res.status(401).json({message: "Confirm Password not equal"})
            }

            const user = new User({name , email, pwd, cpwd})
            
            user.save().then(() => {
                res.status(201).json({message: "User registered Succesfully"})
            }).catch((e) => res.status(500).json({message: "Failed to register"}))
            
        })
        .catch( e => { console.log(e) })
})

router.post('/login' , (req , res) => {
    const { email , pwd } = req.body 
    // console.log(req.body)

    //validation
    function validateEmail(email) {
        const regex = /^[\w.-]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }
    if(!email || !pwd){
        return res.status(401).json({error : "Please fill all the fields!"})
    }
    if(!validateEmail(email)){
        return res.status(401).json({error: "Invalid Email"})
    }

    //Checking existing User
    User.findOne({email : email})
        .then(async (userExist) => {      //userExist contains details of the found user or NULL value
            if(userExist){
                bcrypt.compare( pwd , userExist.pwd)
                    .then((isMatch) =>{
                        if(!isMatch)
                            res.status(401).json({message: "Wrong Password"})
                        else
                            res.status(200).json({message: "Login Successfull"})
                    }).catch(e => console.log(e))

                const token = await userExist.generateAuthToken();
                console.log(token)
                
                //cookie
                res.cookie("jwtoken" , token , { 
                    expires: new Date(Date.now() + 3600000),
                    httpOnly: true,
                    secure: true,
                    sameSite: "none"
                });
            }
            else
                res.status(401).json({message: "Couldnt find the User"})
        })
        .catch((e) => {
            console.log(e)
        })
})

router.post('/addCampaign' , authenticate , (req,res) => {
    const { name, title, description , target, deadline, image } = req.body
    
    if( !name || !title || !description || !target || !deadline || !image){
        res.status(400).json({error: "Pls Fill all the fields"})
    }

    Campaign.findOne({title: title})
        .then((existingCampaign) => {
            if(existingCampaign){
                return res.status(422).json({message: "Campaign already Exists"})
            }

            const campaign = new Campaign({name, title, description , target, deadline, image})
            campaign.save()
                .then(() => {
                    res.status(201).json({message: "Campaign added Succesfully"})
                })
                .catch((e) => res.status(500).json({message: "Failed to add campaign"}))
        
            })
        .catch((e) => {console.log(e)})

    Campaign.findOne({name: name , title: title})
            .then((campaign) => {
                console.log(campaign)
                if(campaign){
                    User.updateOne({_id:req.UserID}, {$push: {yourCampaigns: {campaign:{campaign_id: campaign._id , title: campaign.title }}}})
                        .then(() => console.log("Added Campaign to the User database"))
                        .catch((e)=>console.log(e))
                }
                else    
                console.log("didnt update User")
            })
            .catch((e)=>console.log(e))

})

router.post('/donate' , authenticate , (req,res) => {
    const { campaign , donation } = req.body
    Campaign.updateOne(
        {_id: campaign._id} , 
        {  
            amountCollected: campaign.amountCollected + Number(donation) , 
            $push: {donators:{donator:{_id: req.UserID, name: req.rootUser.name , donation: Number(donation)}}}
            
        }
        )
        .then(()=>{})
        .catch((e)=>{console.log(e)})

    User.updateOne(
        {_id: req.UserID}, 
        {
            balance: req.rootUser.balance - Number(donation),
            $push: {donated_campaigns:{campaign: {campaign_id: campaign._id , donation: Number(donation) }}},
                
        }
        )
        .then(()=>{res.status(201).json({message :`Successfully Donated $${donation} to ${campaign.title}`})})
        .catch((e)=>{console.log(e)})

        
})

module.exports = router