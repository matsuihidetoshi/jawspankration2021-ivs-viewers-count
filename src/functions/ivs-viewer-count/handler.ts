import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';
import { IvsClient, ListChannelsCommand, ListStreamsCommand } from '@aws-sdk/client-ivs'
import { DynamoDB, BatchWriteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'

let response: object
const dynamodb = new DynamoDB({})

const ivsViewerCount: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (_) => {
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

    const queries = requestItems.map(item => {
      return new QueryCommand({
        TableName: 'jawspankration2021-ivs-viewers',
        KeyConditionExpression: "channel = :channel",
        ExpressionAttributeValues: {
          ':channel': { S: item.PutRequest.Item.channel.S },
        },
        Limit: 5,
        ScanIndexForward: false
      })
    })
    
    const results = await Promise.all(
      queries.map(async (query) => {
        return await dynamodb.send(query)
      })
    )

    results.forEach(result => {
      result.Items.forEach(item => {
        console.log(item)
      })
    })

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
