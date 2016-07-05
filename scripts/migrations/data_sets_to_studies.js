print("Starting data_sets_to_studies migration");

// Make a copy of the studies and data_sets collections
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

db.studies.remove({});
db.data_sets.remove({});

db.pre_migration_data_sets.copyTo("data_sets");
print("restored data_sets from pre_migration_data_sets");

// define the migration data (used below)
var nameToMigrationData = {
  // WCDT (hg19)
  "West Coast Dream Team": {
    study_label: "prad_wcdt",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg19",
      read_strandedness: "unknown",
    }
  },
  "TCGA prostate": {
    study_label: "prad_tcga",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg19",
      read_strandedness: "unknown",
    }
  },
  "Beltran prostate NE": {
    study_label: "beltran_2011",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg19",
      read_strandedness: "unknown",
    }
  },
  "OHSU JQ1 cell lines": {
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
  "Califoria Kids Cancer Comparison": {
    study_label: "ckcc",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg38",
      read_strandedness: "unknown",
    }
  },
  "CKCC Reference Cohort": {
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
  "ETK Test Data set": {
    study_label: "EKT_test",
    metadata: {
      normalization: "quan_norm_counts",
      value_scaling: "log2(x+1)",
      quantification_method: "rsem",
      genome_assembly: "hg38",
      read_strandedness: "unknown",
    }
  },
  "ETK Mini test set 1": {
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
  var migrationData = nameToMigrationData[dataSet.name];
  if (migrationData) {
    // create a study from every data set
    db.studies.insert({
      _id: dataSet._id,
      study_label: migrationData.study_label,
      name: dataSet.name,
      collaborations: dataSet.collaborations,
      description: dataSet.description,
      sample_labels: dataSet.sample_labels
    });

    // migrate the data sets

    // generate the samples list
    var samples = dataSet.gene_expression.map(function(sample_label) {
      return {
        study_label: migrationData.study_label,
        sample_label: sample_label
      };
    });

    // generate the sample_index
    var sample_index = {};
    sample_index[migrationData.study_label] = {};
    samples.forEach(function(sample, index) {
      sample_index[migrationData.study_label][sample.sample_label] = index;
    });

    // perform the migration
    db.data_sets.update({ _id: dataSet._id }, {
      $set: {
        value_type: "gene_expression",
        metadata: migrationData.metadata,
        samples: samples,
        sample_index: sample_index,
        currently_wrangling: false,
      },
      $unset: {
        sample_labels: 1,
        gene_expression: 1,
        gene_expression_index: 1,
        gene_expression_wrangling: 1,
      },
      $rename: {
        gene_expression_genes: "feature_labels"
      }
    });
    print("migrated:", dataSet.name);
  } else {
    print("NEED TO DELETE:", dataSet.name,
        "\tdb.data_sets.remove({_id: " + dataSet._id + "});");
  }
});
