/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import {
  extractUnknownDocFailureReason,
  fatalReasonClusterRoutingAllocationUnsupported,
  fatalReasonDocumentExceedsMaxBatchSizeBytes,
} from './extract_errors';

describe('extractUnknownDocFailureReason', () => {
  it('generates the correct error message', () => {
    expect(
      extractUnknownDocFailureReason(
        [
          {
            id: 'unknownType:12',
            type: 'unknownType',
          },
          {
            id: 'anotherUnknownType:42',
            type: 'anotherUnknownType',
          },
        ],
        '.kibana_15'
      )
    ).toMatchInlineSnapshot(`
      "Migration failed because documents were found for unknown saved object types. To proceed with the migration, please delete these documents from the \\".kibana_15\\" index.
      The documents with unknown types are:
      - \\"unknownType:12\\" (type: \\"unknownType\\")
      - \\"anotherUnknownType:42\\" (type: \\"anotherUnknownType\\")
      You can delete them using the following command:
      curl -X POST \\"{elasticsearch}/.kibana_15/_bulk?pretty\\" -H 'Content-Type: application/json' -d'
      { \\"delete\\" : { \\"_id\\" : \\"unknownType:12\\" } }
      { \\"delete\\" : { \\"_id\\" : \\"anotherUnknownType:42\\" } }
      '"
    `);
  });
});

describe('fatalReasonDocumentExceedsMaxBatchSizeBytes', () => {
  it('generate the correct error message', () => {
    expect(
      fatalReasonDocumentExceedsMaxBatchSizeBytes({
        _id: 'abc',
        docSizeBytes: 106954752,
        maxBatchSizeBytes: 104857600,
      })
    ).toMatchInlineSnapshot(
      `"The document with _id \\"abc\\" is 106954752 bytes which exceeds the configured maximum batch size of 104857600 bytes. To proceed, please increase the 'migrations.maxBatchSizeBytes' Kibana configuration option and ensure that the Elasticsearch 'http.max_content_length' configuration option is set to an equal or larger value."`
    );
  });
});

describe('fatalReasonClusterRoutingAllocationUnsupported', () => {
  it('generates the correct error message', () => {
    const errorMessages = fatalReasonClusterRoutingAllocationUnsupported({
      errorMessage: '[some-error] message',
      docSectionLink: 'linkToDocsSection',
    });
    expect(errorMessages.fatalReason).toMatchInlineSnapshot(
      `"[some-error] message To proceed, please remove the cluster routing allocation settings with PUT /_cluster/settings {\\"transient\\": {\\"cluster.routing.allocation.enable\\": null}, \\"persistent\\": {\\"cluster.routing.allocation.enable\\": null}}. Refer to linkToDocsSection for more information on how to resolve the issue."`
    );
    expect(errorMessages.logsErrorMessage).toMatchInlineSnapshot(
      `"[some-error] message Ensure that the persistent and transient Elasticsearch configuration option 'cluster.routing.allocation.enable' is not set or set it to a value of 'all'. Refer to linkToDocsSection for more information on how to resolve the issue."`
    );
  });
});
