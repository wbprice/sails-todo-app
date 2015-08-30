// api/controllers/UserController.js

'use strict';

var _ = require('lodash');
var _super = require('sails-permissions/api/controllers/UserController');

_.merge(exports, _super);
_.merge(exports, {

  // Extend with custom logic here by adding additional fields, methods, etc.

  login: function(req, res) {

    User.findOne({
      email: req.param('email')
    }, function foundUser(err, user) {
      if (err) return res.negotiate(err);
      if (!user) return res.notFound();

      require('machinepack-passwords').checkPassword({
        passwordAttempt: req.param('password'),
        encryptedPassword: user.encryptedPassword
      }).exec({

        error: function(err) {
          return res.negotiate(err);
        },

        incorrect: function() {
          return res.notFound();
        },

        success: function() {
          req.session.me = user.id;
          return res.ok();
        }

      });
    });

  },

  signup: function(req, res) {

    console.log('hit thie signup endpoint');

    var Passwords = require('machinepack-passwords');

    Passwords.encryptPassword({
      password: req.param('password'),
      difficulty: 10
    }).exec({

      error: function(err) {
        return res.negotiate(err);
      },

      success: function(encryptedPassword) {
        require('machinepack-gravatar').getImageUrl({
          emailAddress: req.param('email')
        }).exec({
          error: function(err) {
            return res.negotiate(err);
          },
          success: function(gravatarUrl) {

            User.create({
              name: req.param('name'),
              title: req.param('title'),
              email: req.param('email'),
              encryptedPassword: encryptedPassword,
              lastLoggedIn: new Date(),
              gravatarUrl: gravatarUrl
            }, function userCreated(err, newUser) {

              if (err) {
                console.log('err: ', err);
                console.log('err.invalidAttributes: ', err.invalidAttributes);

                if (err.invalidAttributes && err.invalidAttributes.email &&
                    err.invalidAttributes.email[0] &&
                    err.invalidAttributes.email[0].rule === 'unique') {
                  return res.emailAddressInUse();
                }

                return res.negotiate(err);
              }

              req.session.me = newUser.id;

              return res.json({
                id: newUser.id
              });

            });
          }
        });

      }

    });

  }

});
