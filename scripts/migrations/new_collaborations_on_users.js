// to run:
// mongo MedBook < new_collaborations_on_users.js

print("Starting new_collaborations_on_users migration");

// Make a copy of the users collection
// so that this script can be run many times.
// Then restore from the pre-migration users collection
if (!db.pre_migration_users.findOne()) {
  db.users.renameCollection("pre_migration_users");
  print("renamed old users collection to pre_migration_users");
}

db.pre_migration_users.copyTo("users");
print("restored users collection from pre-migration collection");

// add/update the collaborations field on username/password accounts
db.users.find({
  "services.password": { $exists: true }
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
