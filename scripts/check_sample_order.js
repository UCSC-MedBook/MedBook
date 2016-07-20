// This was written to make sure I didn't screw up the db by making
// sample_labels the ordered index for GenomicExpression instead of
// gene_expression. It appears I didn't but I'm going to check this
// in just in case (to run on production).

db.pre_migration_data_sets.find({}).forEach(function (dataSet) {
  print("looking at", dataSet.name);

  if (dataSet.sample_labels.length !== dataSet.gene_expression.length) {
    console.log("different lengths!!");
    return;
  }

  for (var i = 0; i < dataSet.sample_labels.length; i++) {
    if (dataSet.sample_labels[i] !== dataSet.gene_expression[i]) {
      console.log("CHANGED INDEXES:", i);
      return;
    }
  }
});
