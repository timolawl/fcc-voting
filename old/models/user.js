var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var userSchema = new mongoose.Schema({
    /*
    _id: Number, // used to reference the polls
    userID: String,
    ipAddress: String,
    pollsCreated: [{ type: mongoose.Types.ObjectId, ref: 'Poll' }]
    */
    local           : {
        email       : String,
        password    : { type: String, select: false } // prevents the value from being queried in db queries.
    },
    facebook        : {
        id          : String,
        token       : { type: String, select: false },
        email       : String,
        name        : String
    },
    twitter         : {
        id          : String,
        token       : { type: String, select: false },
        displayName : String,
        username    : String
    },
    google          : {
        id          : String,
        token       : { type: String, select: false },
        email       : String,
        name        : String
    }
});

// http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
// http://stackoverflow.com/questions/35956866/schema-pre-in-mongoose-modules-nodejs

userSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('local.password')) {
        return next();
    }

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        //hash the password along with our new salt
        bcrypt.hash(user.local.password, salt, function(err, hash) {
            if (err) return next(err);

            user.local.password = hash;
            return next();
        });
    });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.local.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', userSchema);
