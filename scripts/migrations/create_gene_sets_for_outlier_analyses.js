// to run:
// mongo MedBook < create_gene_sets_for_outlier_analyses.js
//
// Mission:
// Create three gene sets for each outlier anaysis so that:
// 1. we can call GSEA from the outlier analysis and pass it the _id of
//    a gene set object
// 2. we can switch to the Handsontable viewer for outlier analysis results
//    in the future
//
// Also add a couple summary output variables to each job so we don't have
// to load the whole (large) output object to the client when listing
// the jobs that they have access to:
// - up_genes_count
// - down_genes_count
// - top5percent_genes_count

print("Removing old migration data")

var geneSetsQuery = {
  "associated_object.collection_name": "Jobs"
};
var recordIds = db.gene_sets.distinct("_id", geneSetsQuery);
db.records.remove({
  "associated_object.collection_name": "GeneSets",
  "associated_object.mongo_id": { $in: recordIds },
});
db.gene_sets.remove(geneSetsQuery);


function createGeneSet(job, outlier_type, fields, prependToName, description) {
  var dataArray = job.output[outlier_type + "_genes"];

  // calculate the gene_labels from the data array
  var gene_labels = [];
  for (var i = 0; i < dataArray.length; i++) {
    gene_labels.push(dataArray[i].gene_label);
  }

  // TODO: is this _id okay? I can't figure out how to get the _id from
  // the result of an insert with mongo. It's also a requirement for MedBook
  // that _ids be strings.
  var geneSetId = job._id + "_" + prependToName.replace(" ", "_").toLowerCase();

  var name = prependToName + ": " + job.args.sample_label;
  if (outlier_type !== "top5percent") {
    name += " vs. " + job.args.sample_group_name;
  }

  db.gene_sets.insert({
    _id: geneSetId,
    name: name,
    description: description,

    associated_object: {
      collection_name: "Jobs",
      mongo_id: job._id
    },
    metadata: {
      outlier_type: outlier_type
    },

    fields: fields,
    gene_labels: gene_labels,
    gene_label_field: "Gene",
  });

  var bulk = db.records.initializeUnorderedBulkOp();
  for (var i = 0; i < dataArray.length; i++) {
    var oldRecord = dataArray[i];

    var record = {
      "Gene": oldRecord.gene_label,
      "Sample value": oldRecord.sample_value,
      "Background median": oldRecord.background_median,
      associated_object: {
        collection_name: "GeneSets",
        mongo_id: geneSetId,
      }
    };

    bulk.insert(record);
  }

  // TODO: apparently the writeConcern needs to be an object? I tried
  // giving it a normal node callback function but it complained.
  bulk.execute({});
}

var outlierFields = [
  { name: "Genes", value_type: "String" },
  { name: "Background median", value_type: "Number" },
  { name: "Sample value", value_type: "Number" },
];

var topFivePercentFields = [
  { name: "Genes", value_type: "String" },
  { name: "Sample value", value_type: "Number" },
];

// find all outlier analysis jobs, insert gene sets for them
print("Starting to create gene sets for outlier analyses...");
db.jobs.find({
  name: "UpDownGenes",
  status: "done",
}).forEach(function (job) {
  var filteredGenesParens = "";
  if (job.args.use_filtered_sample_group) {
    filteredGenesParens = " (with gene filters applied)";
  }

  var outlierDescription = "genes in " + job.args.sample_label +
      " compared to " + job.args.sample_group_name + filteredGenesParens +
      " with an IQR of " + job.args.iqr_multiplier;

  var addOutputSummary = {
    "output.up_genes_count": job.output.up_genes.length,
    "output.down_genes_count": job.output.down_genes.length,
  }

  createGeneSet(job, "up", outlierFields, "Up outliers",
      "Upregulated " + outlierDescription);

  createGeneSet(job, "down", outlierFields, "Down outliers",
      "Downregulated " + outlierDescription);

  if (job.output.top5percent_genes) {
    createGeneSet(job, "top5percent", topFivePercentFields,
        "Top 5 percent", "Top 5% of genes in " + job.args.sample_label);

    addOutputSummary["output.top5percent_genes_count"] =
        job.output.top5percent_genes.length;
  }

  db.jobs.update({ _id: job._id }, {
    $set: addOutputSummary
  });
});
