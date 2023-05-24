const express = require("express")
const router = express.Router()
const path = require("path");
const { createUser, userLogin, userLogout, getUserData, rejectRequest, searchFiends, getFriendsProfile,checkToken,
    acceptRequest, forgotPasswordOtp, sendRequest, updateUser, deleteFriend, updatePassword, checkOtp } = require("../controllers/userController")
const { authentication } = require("../auth/auth")


router.post("/api/registeruser", createUser)
router.post("/api/login", userLogin)
router.get("/api/logout", authentication, userLogout)
router.get("/api/getuserdata", authentication, getUserData)
router.get("/api/sendrequest/:id", authentication, sendRequest)
router.put("/api/updateuser", authentication, updateUser)
router.get("/api/searchfriends/:value", authentication, searchFiends)
router.delete("/api/rejectrequest/:id", authentication, rejectRequest)
router.patch("/api/acceptrequest/:id", authentication, acceptRequest)
router.delete("/api/deletefriend/:id", authentication, deleteFriend)
router.post("/api/forgetpassword", forgotPasswordOtp)
router.post("/api/checkotp", checkOtp)
router.post("/api/updatepassword", updatePassword)
router.get("/api/getoneprofile/:id", authentication, getFriendsProfile)
router.post("/api/checktoken",checkToken)

router.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, '../../build/index.html'), function(err) {
      if (err) {
        res.status(500).send(err)
      }
    })
  })


module.exports = router;