const jwt = require('jsonwebtoken')
const userModel = require("../models/userModel")

const authentication = async (req, res, next) => {
    try {
        let token = req.cookies.jwtoken;
        if (!token) return res.status(403).send({ status: false, message: "Token required! Please login to generate token" });

        try {

            const verifyToken = jwt.verify(token, "Shanti-Infotech-Assignment");
            req.decodedToken = verifyToken;

        } catch (error) {
            return res.status(401).send({ status: false, message: error.message });
        }

        let user = await userModel.findOne({ _id: req.decodedToken._id }).populate(['friends.userId', 'friendRequest.userId']);
        if (!user) return res.status(400).send({ status: false, message: "user not found" });

        req.userData = user;

        next()

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { authentication }