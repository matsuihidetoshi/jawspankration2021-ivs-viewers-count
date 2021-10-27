import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';
import { DynamoDB, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb'

const ivsViewerCount: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const dynamodb = new DynamoDB({})
  const tableName = 'jawspankration2021-ivs-viewers'
  const time = Date.now()

  const requestItems = [{
    PutRequest: {
      Item: {
        channel: { S: 'channel-' + String(time)  },
        time: { N: String(time) },
        count: { N: String(time / 10) },
      },
    }
  }]

  
  const batchWriteItem = new BatchWriteItemCommand({
    RequestItems: {
      [tableName]: requestItems,
    },
  })
  await dynamodb.send(batchWriteItem)

  return formatJSONResponse({
    message: 'IVS viewers count was saved.',
    event,
  });
}

export const main = middyfy(ivsViewerCount);
