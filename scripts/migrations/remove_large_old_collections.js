// Remove three large old collections to make backups smaller and quicker

db.expression3.drop()
db.genomic_expression.drop()
db.expression2.drop()
db.expression_isoform.drop()
db.gene_annotation.drop()
