// to run:
// mongo MedBook < new_collaborations_on_users.js

// This is so that we can share things before users with accounts
// have re-logged in to the new medbook.io. Currently many users have
// the old collaborations schema (an array), and we don't want to force
// them all to re-log in to share things with them.

print("Starting new_collaborations_on_users migration");

// Make a copy of the users collection so that we have a backup
db.users.copyTo("pre_migration_users");
print("backed up users collection to pre_migration_users");

// add/update the collaborations field on username/password accounts
db.users.find({
  "services.password": { $exists: true },
  "collaborations.memberOf": { $exists: false },
}).forEach(function (user) {
  var email = user.emails[0].address;
  print("email:", email);

  var newCollabObject = {
    "email_address" : email,
    "personal" : email,
    "memberOf" : [ email ]
  };

  db.users.update({ _id: user._id }, {
    $set: {
      collaborations: newCollabObject
    }
  });
});
