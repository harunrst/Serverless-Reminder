import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as elasticsearch from 'elasticsearch'
import * as httpAwsEs from 'http-aws-es'

const esHost = process.env.ES_ENDPOINT

const es = new elasticsearch.Client({
  hosts: [esHost],
  connectionClass: httpAwsEs
})

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing events batch from DynamoDB', JSON.stringify(event))

  for (const record of event.Records) {
    console.log('Processing record', JSON.stringify(record))
    if (record.eventName !== 'INSERT') {
      continue
    }

    const newItem = record.dynamodb.NewImage

    if (newItem.lock.BOOL) {
      const todoId = newItem.todoId.S

      const body = {
        todoId: newItem.todoId.S,
        userId: newItem.userId.S,
        createdAt: newItem.createdAt.S,
        name: newItem.name.S,
        priority: newItem.priority.N,
      }

      await es.index({
        index: 'notes-index',
        type: 'notes',
        id: todoId,
        body
      })
    }
  }
}
