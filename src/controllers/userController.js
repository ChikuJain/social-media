const userModel = require('../models/userModel')
const bcrypt = require("bcrypt");
const axios = require("axios");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { validateString,
    validateRequest,
    validateEmail,
    regexPhoneNumber,
    regxName,
    validatePassword } = require("../validators/validators");

let createUser = async function (req, res) {
    try {
        let data = req.body
        console.log("hello")
        let { firstName, lastName, email, phone, password, cpassword, address, country, state, city } = data
        if (validateRequest(data)) { return res.status(400).send({ status: false, message: "please provide the data in the body" }) }

        if (!validateString(firstName)) { return res.status(400).send({ status: false, message: "please provide the name" }) }
        if (!regxName(firstName)) { return res.status(400).send({ status: false, message: "please provide a valid name" }) }

        if (!validateString(lastName)) { return res.status(400).send({ status: false, message: "please provide the name" }) }
        if (!regxName(lastName)) { return res.status(400).send({ status: false, message: "please provide a valid name" }) }

        if (!validateString(email)) { return res.status(400).send({ status: false, message: "please provide the email" }) }
        if (!validateEmail(email)) { return res.status(400).send({ status: false, message: "please provide a valid email" }) }

        if (!validateString(phone)) { return res.status(400).send({ status: false, message: "please provide the phone number" }) }
        if (!regexPhoneNumber(phone)) { return res.status(400).send({ status: false, message: "please provide a valid phone number" }) }

        if (!validateString(password)) { return res.status(400).send({ status: false, message: "please provide the password" }) }
        if (!validatePassword(password)) { return res.status(400).send({ status: false, message: "Please provide a valid password with atleast one uppercase one lowercase  one special character and must contain atleast 6 characters" }) }

        if (!validateString(cpassword)) { return res.status(400).send({ status: false, message: "please provide the password" }) }
        if (cpassword !== password) { return res.status(400).send({ status: false, message: "password is not matching" }) }

        if (!validateString(address)) { return res.status(400).send({ status: false, message: "please provide the address" }) }

        if (!validateString(country)) { return res.status(400).send({ status: false, message: "please provide the country" }) }

        if (!validateString(state)) { return res.status(400).send({ status: false, message: "please provide the state" }) }

        if (!validateString(city)) { return res.status(400).send({ status: false, message: "please provide the city" }) }

        let coordnates = await axios.get(`https://geocode.maps.co/search?city=${city}&state=${state}&country=${country}`)
        if (coordnates.length == 0) { return res.status(400).send({ status: false, message: "please provide valid city, state or country" }) }
        console.log(coordnates)

        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);
        console.log(encryptedPassword)
        data.password = encryptedPassword

        let isDuplicateEmail = await userModel.findOne({ email: data.email })
        if (isDuplicateEmail) { return res.status(400).send({ status: false, message: "This email is already exists" }) }

        let isDuplicatePhone = await userModel.findOne({ phone: data.phone })
        if (isDuplicatePhone) { return res.status(400).send({ status: false, message: "This phone number is already exists" }) }

        let obj = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            email: email,
            password: data.password,
            address: {
                text: address,
                city: city,
                state: state,
                country: country,
                
            }
            location:{
            coordinate: [coordnates.data[0].lon, coordnates.data[0].lat]
        }
        }

        let createdData = await userModel.create(obj)
        res.status(201).send({ status: true, message: "user registered successfully", data: createdData })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}

let userLogin = async function (req, res) {
    try {
        let email = req.body.email
        let password = req.body.password
        if (!validateString(email)) { return res.status(400).send({ status: false, message: "email is required" }) }
        if (!validateEmail(email)) { return res.status(400).send({ status: false, message: "please provide a valid email" }) }

        if (!validateString(password)) { return res.status(400).send({ status: false, message: "password is required" }) }

        let user = await userModel.findOne({ $or:[{email:email},{phone:email}] });
        if (!user) return res.status(401).send({ status: false, message: "email or phone is not correct", });

        const passwordDetails = await bcrypt.compare(password, user.password)
        if (!passwordDetails) return res.status(401).send({ status: false, message: "password is incorrect, please provide correct password" })

        let token = jwt.sign(
            {
                _id: user._id.toString(),
                iat: new Date().getTime(),
            },
            "Shanti-Infotech-Assignment",
        );

        res.cookie("jwtoken", token, {
            expires: new Date(Date.now() + 600000),
        });
  

        res.status(200).send({ userId: user._id, userName: user.fname, token: token });
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}

let userLogout = async function (req, res) {
    try {
        res.clearCookie("jwtoken", { path: "/" });
        res.status(201).send({ status: true, message: "user logout successfully" })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


let getUserData = async function (req, res) {
    try {
        res.status(200).send({status:true,message:"user data",data:req.userData})
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



let rejectRequest = async function (req, res) {
    try {
        let userData = req.userData;
        let id = req.params.id;

        let cond = false;
        for (let i = 0; i < userData.friendRequest.length; i++) {
            if (userData.friendRequest[i]._id == id) {
                userData.friendRequest.splice(i, 1)
                cond = true
                break;
            }
        }

        if (!cond) return res.status(400).send({ status: false, message: "something went wrong" })

        let finaldata = await userData.save();
        res.status(200).send({status:true,message:"request rejected",data:finaldata});

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



let acceptRequest = async function (req, res) {
    try {
        let userData = req.userData;
        let id = req.params.id;
        console.log(id)

        let acceptedFriend;
        let cond = false;

        for (let i = 0; i < userData.friendRequest.length; i++) {
            if (userData.friendRequest[i].userId._id.toString() == id) {
                console.log("from loop")
                acceptedFriend = userData.friendRequest.splice(i, 1)
                cond = true
                break;
            };
        };
     
        if (!cond) return res.status(400).send({ status: false, message: "something went wrong" });
        console.log("hello")

        userData.friends.push({ userId: acceptedFriend[0].userId._id });

        let finaldata = await userData.save();

        let senderDoc = await userModel.findById(id)
        if (!senderDoc) return res.status(400).send({ status: false, message: "something went wrong" });

        senderDoc.friends.push({ userId: userData._id })

        let dta = await senderDoc.save()

        res.status(200).send({status:true,message:"request accepted",data:finaldata});

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



let sendRequest = async function (req, res) {
    try {
        let userData = req.userData;
        let id = req.params.id;
        console.log(id, "hello")
        let findDoc = await userModel.findById(id)
        if (!findDoc) return res.status(400).send({ status: false, message: "something went wrong" });


        for (let i = 0; i < findDoc.friendRequest.length; i++) {
            if (findDoc.friendRequest[i].userId.toString() == userData._id) {
                return res.status(400).send({ status: false, message: "You Already sended the request to this person" });
            };
        }

        let obj = {};
        obj.userId = userData._id

        findDoc.friendRequest.push(obj);

        let finaldata = await findDoc.save();
        res.status(200).send({ status: true, message: "request sended" });
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



let searchFiends = async function (req, res) {
    try {
        let maxDist = req.params.value
        let userData = req.userData;
        let longitude = userData.location.coordinates[0];
        let latitude = userData.location.coordinates[1];
        let data = await userModel.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [longitude, latitude] },
                    key: "location",
                    maxDistance: parseFloat(maxDist) * 1609,
                    distanceField: "dist.calculated",
                    sherical: true
                }
            }
        ])

        console.log(data)
        res.status(200).send({status:true,message:"data collected",data:data})
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



let viewProfile = async function (req, res) {
    try {
        let id = req.body._id

        let profile = await userModel.findById(id)
        if (!profile) return res.status(400).send({ status: false, message: "something went wrong" });

        res.status(200).send({ profile });

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



let forgotPasswordOtp = async function (req, res) {
    try {
        const { cred } = req.body

        let userData = await userModel.findOne({$or:[{email:cred},{phone:cred}]})
        if(!userData) return res.status(400).send({ status: false, message: "Invalid Credentials" })

        generateOtp = function (size) {
            const zeros = '0'.repeat(size - 1);
            const x = parseFloat('1' + zeros);
            const y = parseFloat('9' + zeros);
            const confirmationCode = String(Math.floor(x + Math.random() * y));
         return confirmationCode;
        }

        let otp = generateOtp(4)

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "chiku.jain.120120@gmail.com",
                pass: process.env.CRED
            }
        });

        const mailOptions = {
            from:"chiku.jain.120120@gmail.com",
            to:userData.email,
            subject:"Otp Verification Code",
            html:`<h1>This is the verification code for your password reset ${otp}</h1>`
        }

        transporter.sendMail(mailOptions,async(error,info)=>{
            if(error){
                console.log("Error",error) ;
                res.status(500).send({status:true,message:"Something went wrong"});
            }else{
                console.log("Email sent"+ info.response);
                userData.otp = otp;
                let sav = await userData.save()

                let token = jwt.sign(
                    {
                        _id: userData._id.toString(),
                        iat: new Date().getTime(),
                    },
                    "Shanti-Infotech-Assignment",
                );
        
                res.cookie("resetToken", token, {
                    expires: new Date(Date.now() + 360000),
                });
                res.status(200).send({status:true,message:"Otp send successfully"});
            }
        })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



let updateUser = async function (req, res) {
    try {
        let userData = req.userData
        let { firstName, lastName, email, phone, address } = req.body
        let { text, state, city, country } = address

        if (firstName) {
            if (!validateString(firstName)) { return res.status(400).send({ status: false, message: "please provide first name" }) }
            if (!regxName(firstName)) { return res.status(400).send({ status: false, message: "provide valid first name" }) }
            userData.firstName = firstName
        }

        if (lastName) {
            if (!validateString(lastName)) { return res.status(400).send({ status: false, message: "please provide first name" }) }
            if (!regxName(lastName)) { return res.status(400).send({ status: false, message: "provide valid first name" }) }
            userData.lastName = lastName
        }

        if (email) {
            if (!validateString(email)) { return res.status(400).send({ status: false, message: "please provide email" }) }
            if (!validateEmail(email)) { return res.status(400).send({ status: false, message: "provide valid email" }) }
            let uniqueEmail = await userModel.find({ $and: [{ _id: { $ne: userData._id } }, { email: email }] })
            console.log(uniqueEmail)
            if (uniqueEmail.length) { return res.status(400).send({ status: false, message: "This email is already registered" }) }
            userData.email = email
        }

        if (phone) {
            if (!validateString(phone)) { return res.status(400).send({ status: false, message: "please provide phone number" }) }
            if (!regexPhoneNumber(phone)) { return res.status(400).send({ status: false, message: "provide valid phone number" }) }
            let uniquephone = await userModel.find({ $and: [{ _id: { $ne: userData._id } }, { phone: phone }] })
            if (uniquephone.length) { return res.status(400).send({ status: false, message: "This phone number is already registered" }) }
            userData.phone = phone
        }

        if (address) {
            if (!state || !country || !city || !text) return res.status(400).send({ status: false, message: "provide all the fields of address" })
            let coordnates = await axios.get(`https://geocode.maps.co/search?city=${city}&state=${state}&country=${country}`)
            if (coordnates.length == 0) { return res.status(400).send({ status: false, message: "please provide valid city, state or country" }) }
            userData.address = address;
        }
        console.log("hello")
        let finaldata = await userData.save()
        res.status(200).send({status:true,message:"user updated",data:finaldata})
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


let deleteFriend = async function (req, res) {
    try {
        let userData = req.userData;
        let id = req.params.id

        for (let i = 0; i < userData.friends.length; i++) {
            if (userData.friends[i].userId._id.toString() == id) {
                userData.friends.splice(i, 1)
                break;
            }
        }

        let res = await userData.save()

        let frnd = await userModel.findById(id)
        if (!frnd) return res.status(400).send({ status: false, message: "something went wrong" });

        for (let i = 0; i < frnd.friends.length; i++) {
            if (frnd.friends[i].userId._id.toString() == userData._id) {
                frnd.friends.splice(i, 1)
                break;
            }
        }

        let fRes = await frnd.save();

        res.status(200).send({status:true,message:"deleted",data:res});

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


let checkOtp = async function(req,res){
    try{

        let {otp} = req.body
        
        let token = req.cookies.resetToken;
        console.log(req.cookies)
        if (!token) return res.status(403).send({ status: false, message: "please try again" });

        let verifyToken;

        try {
             verifyToken = jwt.verify(token, "Shanti-Infotech-Assignment");
        } catch (error) {
            return res.status(401).send({ status: false, message: error.message });
        }

        let user = await userModel.findOne({ _id: verifyToken._id });
        if (!user) return res.status(400).send({ status: false, message: "user not found" });

        if(otp!=user.otp)return res.status(400).send({ status: false, message: "wrong Otp" });

        let token2 = jwt.sign(
            {
                otp:otp,
                _id: user._id.toString(),
                iat: new Date().getTime(),
            },
            "Shanti-Infotech-Assignment",
        );

        res.cookie("resetToken", token2, {
            expires: new Date(Date.now() + 300000),
        });


        res.status(200).send({status:true,message:"otp matched"})

    }catch(err){
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


let updatePassword = async function(req,res){
    try{

        let {password,cpassword} = req.body;

        let token = req.cookies.resetToken;
        if (!token) return res.status(403).send({ status: false, message: "please try again" });

        let verifyToken;

        try {
             verifyToken = jwt.verify(token, "Shanti-Infotech-Assignment");
        } catch (error) {
            return res.status(401).send({ status: false, message: error.message });
        }

        let user = await userModel.findOne({ _id: verifyToken._id });
        if (!user) return res.status(400).send({ status: false, message: "user not found" });

        if(verifyToken.otp!=user.otp)return res.status(400).send({ status: false, message: "Something went wrong" });

        if (!validateString(password)) { return res.status(400).send({ status: false, message: "please provide the password" }) }
        if (!validatePassword(password)) { return res.status(400).send({ status: false, message: "Please provide a valid password with atleast one uppercase one lowercase  one special character and must contain atleast 6 characters" }) }
        if (!validateString(cpassword)) { return res.status(400).send({ status: false, message: "please provide the password" }) }
        if(cpassword!=password)return res.status(400).send({ status: false, message: "password is not matching" })

        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);
        console.log(encryptedPassword)
        user.password = encryptedPassword
        user.otp = ""
        let finl = await user.save()
        res.clearCookie("jwtoken", { path: "/" });
        res.status(200).send({status:true,message:"password change successfully"})

    }catch(err){
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}

let getFriendsProfile = async function (req,res){
    try{
        let id = req.params.id;
        console.log(id)

        let data = await userModel.findOne({_id:id})
        if(!data)return res.status(400).send({ status: false, message: "Something went wrong" })

        res.status(200).send({status:true,message:"friend profile",data:data})

    }catch(err){
        console.log(err)
    res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = {
    createUser, userLogin, userLogout, getUserData,getFriendsProfile,
    rejectRequest, searchFiends, acceptRequest, checkOtp,updatePassword,
    viewProfile, forgotPasswordOtp, sendRequest, updateUser, deleteFriend
}
