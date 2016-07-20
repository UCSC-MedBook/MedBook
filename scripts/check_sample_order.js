// This was written to make sure I didn't screw up the db by making
// sample_labels the ordered index for GenomicExpression instead of
// gene_expression. It appears I didn't but I'm going to check this
// in just in case (to run on production).
// (See: data_sets_to_studies.js line 164)

db.pre_migration_data_sets.find({}).forEach(function (oldDataSet) {
  print("looking at", oldDataSet.name);

  var newDataSet = db.data_sets.findOne({
    _id: oldDataSet._id
  });

  if (!newDataSet) { return; }

  if (oldDataSet.sample_labels.length !== oldDataSet.gene_expression.length) {
    print("DIFFERENT LENGTHS!!");
    return;
  }

  for (var i = 0; i < oldDataSet.sample_labels.length; i++) {
    if (oldDataSet.sample_labels[i].indexOf(oldDataSet.gene_expression[i]) === -1) {
      print("CHANGED INDEXES:", i);
      return;
    }
  }
});
