import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';
import { IvsClient, ListChannelsCommand, ListStreamsCommand } from '@aws-sdk/client-ivs'
import { DynamoDB, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb'

let response: object

const ivsViewerCount: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const dynamodb = new DynamoDB({})
  const tableName = 'jawspankration2021-ivs-viewers'
  const time = Date.now()
  const counts: { [key: string]: number } = {}
  const ivs = new IvsClient({})

  try {
    const listChannels = new ListChannelsCommand({})
    const resListChannels = await ivs.send(listChannels)
    if (resListChannels.channels) {
      resListChannels.channels.forEach((channel) => {
        if (channel.arn) {
          counts[channel.arn] = 0
        }
      })
    }

    const listStreams = new ListStreamsCommand({})
    const resListStreams = await ivs.send(listStreams)
    if (resListStreams.streams) {
      resListStreams.streams.forEach((stream) => {
        if (stream.channelArn && stream.viewerCount) {
          counts[stream.channelArn] += stream.viewerCount
        }
      })
    }

    const requestItems = Object.entries(counts).map((item) => ({
      PutRequest: {
        Item: {
          channel: { S: item[0] },
          time: { N: String(time) },
          count: { N: String(item[1]) },
        },
      },
    }))
  
    
    const batchWriteItem = new BatchWriteItemCommand({
      RequestItems: {
        [tableName]: requestItems,
      },
    })
    await dynamodb.send(batchWriteItem)

    response = {
      statusCode: 200,
      body: JSON.stringify(counts),
    }
  } catch(err) {
    console.log(err)
    return err
  }

  return response
}

export const main = middyfy(ivsViewerCount);
