// to run:
// mongo MedBook < introduce_gene_sets.js

print("Starting introduce_gene_sets migration");


// backup collections
if (!db.pre_migration_records.findOne()) {
  db.forms.renameCollection("pre_migration_forms");
  db.records.renameCollection("pre_migration_records");

  db.gene_sets.renameCollection("pre_migration_gene_sets");
  db.gene_set_collections.renameCollection("pre_migration_gene_set_collections");

  db.jobs.renameCollection("pre_migration_jobs");

  print("renamed old collections to pre_migration");
}


// restore collections
db.forms.remove({});
db.pre_migration_forms.copyTo("forms");

db.records.remove({});
db.pre_migration_records.copyTo("records");

db.gene_sets.remove({});
db.pre_migration_gene_sets.copyTo("gene_sets");

db.gene_set_collections.remove({});
db.pre_migration_gene_set_collections.copyTo("gene_set_collections");
db.gene_set_groups.drop();

db.jobs.remove({});
db.pre_migration_jobs.copyTo("jobs");

print("restored pre_migration collections");


// migrate records to new schema
db.records.update({}, {
  $rename: {
    form_id: "associated_object.mongo_id"
  },
  $set: {
    // all records currently are from forms
    "associated_object.collection_name": "Forms"
  },
}, { multi: true });


// migrate gene_sets
db.gene_sets.update({}, {
  $rename: {
    gene_set_collection_id: "gene_set_group_id"
  }
}, { multi: true });


// rename gene_set_groups, update schema (add gene_set_count, gene_set_names)
db.gene_set_collections.renameCollection("gene_set_groups");

db.gene_set_groups.find({}).forEach(function (geneSetGroup) {
  // NOTE: already did gene_sets migration
  var geneSetNames = db.gene_sets.distinct("name", {
    gene_set_group_id: geneSetGroup._id
  }).sort();

  db.gene_set_groups.update({
    _id: geneSetGroup._id
  }, {
    $set: {
      gene_set_count: geneSetNames.length,
      gene_set_names: geneSetNames,
    }
  });
});


// remove gene sets that aren't part of a gene set group
// (this is cruft left over from when someone deleted a gene set
// group but the code wasn't there to delete the associated gene sets)
db.gene_sets.remove({
  gene_set_group_id: {
    $nin: db.gene_set_groups.distinct("_id")
  }
});


// migrate forms to include sample_labels and sample_count
db.forms.find({}).forEach(function (form) {
  // grab distinct sample labels from records
  var sample_labels = db.records.distinct(form.sample_label_field, {
    "associated_object.collection_name": "Forms",
    "associated_object.mongo_id": form._id
  }).sort();

  db.forms.update({ _id: form._id }, {
    $set: {
      sample_labels: sample_labels,
      sample_count: sample_labels.length,
    }
  });
});


// update the arguments in old jobs (gene set collection ==> group)
db.jobs.update({ name: "RunLimmaGSEA" }, {
  $rename: {
    "args.gene_set_collection_id": "args.gene_set_group_id",
    "args.gene_set_collection_name": "args.gene_set_group_name",
  },
}, { multi: true });


print("Done with introduce_gene_sets migration");
