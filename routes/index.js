const router = require("express").Router();

// Passport & Profile hbs
const loginCheck = () => {
  return (req, res, next) => {
    // with basic-auth: req.session.user
    if (req.isAuthenticated()) {
      next()
    } else {
      res.redirect('/login')
    }
  }
}


/* GET home page */
router.get("/", (req, res, next) => {
  res.render("index");
});









router.get('/profile', loginCheck(), (req, res, next) => {
  // with basic-auth: req.session.user
  const loggedInUser = req.user
  res.render('profile', { user: loggedInUser })
});

module.exports = router;