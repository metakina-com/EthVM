#!/bin/bash -e

AVRO_TOOLS="docker run --rm -v $(pwd):/share enkryptio/avro-tools"

GO_GEN="${AVRO_TOOLS} go"
JAVA_GEN="${AVRO_TOOLS} java"

${GO_GEN} --package=models /share/apps/eth/ethvm/models /share/apps/avro-schemas/block.schema.v1.asvc /share/apps/avro-schemas/pendingtx.schema.v1.asvc

${JAVA_GEN} compile schema /share/apps/avro-schemas/block.schema.v1.asvc /share/apps/bolt/src/main/kotlin
${JAVA_GEN} compile schema /share/apps/avro-schemas/pendingtx.schema.v1.asvc /share/apps/bolt/src/main/kotlin
