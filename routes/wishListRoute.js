const express = require("express")

const {
  addTourToWishList,
  removeTourFromWishList,
  getLoggedUserWishList
} = require("../services/wishListService")

const { addTourValidator, removeTourValidator } = require("../utils/validators/wihListValidator")
const authService = require('../services/authService');

const router = express.Router()

router.use(
  authService.protect,
  authService.allowedTo("user")
)

router.route("/")
  .post(
    addTourValidator,
    addTourToWishList
  )
  .get(
    getLoggedUserWishList
  )

router.route("/:tourId")
  .delete(removeTourValidator, removeTourFromWishList)

module.exports = router