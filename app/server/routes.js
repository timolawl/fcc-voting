'use strict';

module.exports = (app, passport) => {
    app.route('/')
       .get((req, res) => {
           if (req.isAuthenticated())
             res.render('index', { loggedIn: 'true', path: 'index' }); //loggedIn still needed to not display the 'sign up' button
           else res.render('index', { path: 'index' });
        });

    app.route('/signup') // this allows for the question mark path.
        .get(isNotLoggedIn, (req, res) => {
            res.render('userform', { path: 'signup', message: req.flash('signupMessage') });
        })
        .post(passport.authenticate('local-signup', {
            successRedirect: '/',
            failureRedirect: '/signup',
            failureFlash: true
        }));

    app.route('/login')
        .get(isNotLoggedIn, (req, res) => {
            res.render('userform', { path: 'login', message: req.flash('loginMessage') }); // should I only have one file between signup and login? Just pass in an object to specify which is which?
        })
        .post(passport.authenticate('local-login', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
        }));
       
    
    app.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/');
        });

    app.route('/reset')
        .get((req, res) => {
            res.render('userform', { path: 'reset' });
        });

    app.route('/createpoll')
        .get((req, res) => {
            res.render('pollform'); // each option needs to pass through logIn middleware.
        });

    app.route('/mypolls') // redirect here instead after login?
        .get((req, res) => {
            res.render('mypolls', { path: 'mypolls' }); // use index?
        });

    app.use((req, res) => { res.status(400).send('Bad request.'); });
};

function isLoggedIn (req, res, next) {
    if (req.isAuthenticated()) // isAuthenticated is a passport JS add-on method
        return next();

    res.redirect('/');
}

function isNotLoggedIn (req, res, next) {
    if (req.isAuthenticated())
        res.redirect('/');
    else return next();
}
