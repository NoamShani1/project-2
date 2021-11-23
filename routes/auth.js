const router = require("express").Router();

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const passport = require("passport");

// How many rounds should bcrypt run the salt (default [10 - 12 rounds])
const saltRounds = 10;

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");


router.get("/signup", isLoggedOut, (req, res) => {
  res.render("signup");
});


// PASSPORT
router.post('/login', passport.authenticate('local', {
	successRedirect: '/profile',
	failureRedirect: '/login',
	passReqToCallback: true
}))

router.get('/github', passport.authenticate('github'));

router.get('/auth/github/callback', passport.authenticate('github', {
	successRedirect: '/profile',
	failureRedirect: '/login'
}))
router.post('/signup', (req, res, next) => {
  const { username, password } = req.body;
  console.log('hi')
  // validation

  if (password.length < 8) {
    res.render('signup', {
      message: 'Your password has to be at least 8 characters!',
    });
    return;
  }

  if (username.length === 0) {
    res.render('signup', { message: 'Please provide a username!' });
    return;
  }

  User.findOne({ username: username }).then((userFromDB) => {
    if (userFromDB !== null) {
      res.render('signup', { message: 'This username is already taken' });
      return;
    } else {
      const salt = bcrypt.genSaltSync();
      const hash = bcrypt.hashSync(password, salt);

      User.create({ username: username, password: hash })
        .then((createdUser) => {
						res.redirect('/login');
						 
						// Passport code: log the user in using passport
						req.login(createdUser, err => {
							if (err) {
								next(err);
							} else {
								res.redirect('/')
							}
						});
					})
					.catch(err => {
						next(err);
					})
			}
		})
}); 



router.get("/login", isLoggedOut, (req, res) => {
  res.render("login");
});

router.post("/login", isLoggedOut, (req, res, next) => {
  const { username, password } = req.body;

  if (!username) {
    return res
      .status(400)
      .render("login", { errorMessage: "Please provide your username." });
  }

  // Here we use the same logic as above
  // - either length based parameters or we check the strength of a password
  if (password.length < 8) {
    return res.status(400).render("/login", {
      errorMessage: "Your password needs to be at least 8 characters long.",
    });
  }

  // Search the database for a user with the username submitted in the form
  User.findOne({ username })
    .then((user) => {
      // If the user isn't found, send the message that user provided wrong credentials
      if (!user) {
        return res
          .status(400)
          .render("login", { errorMessage: "Wrong credentials." });
      }

      // If user is found based on the username, check if the in putted password matches the one saved in the database
      bcrypt.compare(password, user.password).then((isSamePassword) => {
        if (!isSamePassword) {
          return res
            .status(400)
            .render("login", { errorMessage: "Wrong credentials." });
        }
        req.session.user = user;
        // req.session.user = user._id; // ! better and safer but in this case we saving the entire user object
        return res.redirect("/");
      });
    })

    .catch((err) => {
      // in this case we are sending the error handling to the error handling middleware that is defined in the error handling file
      // you can just as easily run the res.status that is commented out below
      next(err);
      // return res.status(500).render("login", { errorMessage: err.message });
    });
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .render("logout", { errorMessage: err.message });
    }
    res.redirect("/");
  });
});


// // ALTERNATIVE LOGOUT CODE FOR PASSPORT?? 👀
// router.get('/logout', (req, res, next) => {
// 	// basic auth: req.session.destroy()	 
// 	req.logout()
// 	res.redirect('/')
// });


module.exports = router;
