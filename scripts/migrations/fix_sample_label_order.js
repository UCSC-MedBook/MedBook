// Fix the sample label ordering problem introduced by
// data_sets_to_studies.js line 164

db.pre_migration_data_sets.find({}).forEach(function (oldDataSet) {
  print("\nupdating", oldDataSet.name);

  var changed = db.data_sets.update({ _id: oldDataSet._id }, {
    $set: {
      sample_labels: oldDataSet.gene_expression
    }
  });

  print(changed);
});
