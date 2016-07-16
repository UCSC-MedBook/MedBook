// to run:
//mongo MedBook < data_sets_to_studies.js

print("Starting data_sets_to_studies migration");

// Make a copy of the studies, data_sets, and sample_groups collections
// so that this script can be run many times.
// Then restore from the pre-migration data_sets collection
if (!db.pre_migration_studies.findOne()) {
  db.studies.renameCollection("pre_migration_studies");
  print("renamed old studies collection to pre_migration_studies");
}
if (!db.pre_migration_data_sets.findOne()) {
  db.data_sets.renameCollection("pre_migration_data_sets");
  print("renamed old data_sets collection to pre_migration_data_sets");
}
if (!db.pre_migration_sample_groups.findOne()) {
  db.sample_groups.renameCollection("pre_migration_sample_groups");
  print("renamed old sample_groups collection to pre_migration_sample_groups");
}

db.studies.remove({});
db.data_sets.remove({});
db.sample_groups.remove({});

db.pre_migration_data_sets.copyTo("data_sets");
db.pre_migration_sample_groups.copyTo("sample_groups");
print("restored data_sets, sample_groups from pre_migration collections");

// define the migration data (used below)
var idToMigrationData = {
  // WCDT (hg19)
  "54795e11b089fea9740779e4": {
    name: "West Coast Dream Team",
    study_label: "prad_wcdt",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg19",
      read_strandedness: "unknown",
    }
  },
  "8j67EfaMQQB7zqQuC": {
    name: "TCGA prostate",
    study_label: "prad_tcga",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg19",
      read_strandedness: "unknown",
    }
  },
  "hf32gGj3sezG9t9ME": {
    name: "Beltran prostate NE",
    study_label: "beltran_2011",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg19",
      read_strandedness: "unknown",
    }
  },
  "nzsmSuNiHNnhvsxiw": {
    name: "OHSU JQ1 cell lines",
    study_label: "ohsu_jq1",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg19",
      read_strandedness: "unknown",
    }
  },

  // CKCC (hg38)
  "L5df223T7NMK3Y986": {
    name: "California Kids Cancer Comparison",
    study_label: "ckcc",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg38",
      read_strandedness: "unknown",
    }
  },
  "YDcb7YWfXTdjXbSKX": {
    name: "CKCC Reference Cohort",
    study_label: "ckcc_reference",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg38",
      read_strandedness: "unknown",
    }
  },

  // Ellen's test data
  "Xmr3YCnvvkuBX2SCd": {
    name: "ETK Test Data set",
    study_label: "EKT_test",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg38",
      read_strandedness: "unknown",
    }
  },
  "sH2WdCf9cYQAbWbNG": {
    name: "ETK Mini test set 1",
    study_label: "EKT_mini_test_1",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg38",
      read_strandedness: "unknown",
    }
  },
};

db.data_sets.find().forEach(function (dataSet) {
  // loop through each
  // if there's no migration data, make a note to delete it
  // (delete the data sets that Ellen loaded when she
  // didn't have access to CKCC)
  var migrationData = idToMigrationData[dataSet._id];
  if (migrationData) {
    // make sure I didn't screw up somewhere
    if (dataSet.name !== migrationData.name) {
      print("DATA SET NAME NOT EQUAL TO MIGRATION NAME");
      print("dataSet.name:", dataSet.name);
      print("migrationData.name:", migrationData.name);
      quit(1);
    }

    // set the count for the sample group migration
    idToMigrationData[dataSet._id].sample_count =
        dataSet.gene_expression.length;

    // generate the sample_labels
    var sample_labels = dataSet.gene_expression.map(function(sample_label) {
      return migrationData.study_label + "/" + sample_label;
    });

    // generate the sample_label_index
    var sample_label_index = {};
    sample_labels.forEach(function(sample_label, index) {
      sample_label_index[sample_label] = index;
    });

    // create a study from every data set
    db.studies.insert({
      _id: dataSet._id,
      study_label: migrationData.study_label,
      name: dataSet.name,
      collaborations: dataSet.collaborations,
      description: dataSet.description,
      sample_labels: sample_labels
    });

    // update the data set
    db.data_sets.update({ _id: dataSet._id }, {
      $set: {
        value_type: "gene_expression",
        metadata: migrationData.metadata,
        sample_labels: sample_labels,
        sample_label_index: sample_label_index,
      },
      $unset: {
        gene_expression: 1,
        gene_expression_index: 1,
      },
      $rename: {
        gene_expression_genes: "feature_labels",
        gene_expression_wrangling: "currently_wrangling",
      }
    });

    print("migrated:", dataSet.name);
  } else {
    print("NOT MIGRATED:", dataSet.name,
        "\tdb.data_sets.remove({_id: " + dataSet._id + "});");
  }
});

// rename gene_expression to genomic_expression
if (!db.genomic_expression.findOne()) {
  print("starting move from gene_expression to genomic_expression");
  db.genomic_expression.drop()
  db.gene_expression.renameCollection("genomic_expression");

  db.genomic_expression.update({}, {
    $rename: {
      rsem_quan_log2: "values",
      gene_label: "feature_label",
    },
  }, { multi: true });
  print("done moving from gene_expression to genomic_expression");
}

// migrate sample groups
db.sample_groups.find().forEach(function (sampleGroup) {
  for (var i = 0; i < sampleGroup.data_sets.length; i++) {
    var dataSet = sampleGroup.data_sets[i];

    var migrationData = idToMigrationData[dataSet.data_set_id];

    // set the name
    dataSet.data_set_name = migrationData.name;

    // figure out the study_label and update all the sample_labels with it
    var study_label = migrationData.study_label;
    dataSet.sample_labels = dataSet.sample_labels.map(function (label) {
      return study_label + "/" + label;
    });

    // rename sample_labels_count ==> sample_count
    dataSet.sample_count = dataSet.sample_labels_count;
    delete dataSet.sample_labels_count;

    // put in the original sample count
    dataSet.unfiltered_sample_count = migrationData.sample_count;

    for (var j = 0; j < dataSet.filters.length; j++) {
      var filterType = dataSet.filters[j].type;

      if (filterType === "data_loaded") {
        // remove the filter
        dataSet.filters.splice(j, 1);
        j--;
        continue;
      } else if (filterType === "sample_label_list") {
        dataSet.filters[j] = {
          type: "include_sample_list",
          options: {
            sample_labels: dataSet.filters[j].options.sample_labels.map(
                  function (label) {
              return study_label + "/" + label;
            })
          },
        }
      } else if (filterType === "exclude_sample_label_list") {
        dataSet.filters[j] = {
          type: "exclude_sample_list",
          options: {
            sample_labels: dataSet.filters[j].options.sample_labels.map(
                  function (label) {
              return study_label + "/" + label;
            }),
          }
        }
      } else {
        print("WHAT");
      }

      dataSet.filters[j].options.sample_count =
          dataSet.filters[j].options.sample_labels.length;
    }
  }

  // put the mutated `data_sets` back into the database
  db.sample_groups.update({ _id: sampleGroup._id }, {
    $set: {
      data_sets: sampleGroup.data_sets,
      value_type: "gene_expression"
    }
  });
});

print("DONE");
