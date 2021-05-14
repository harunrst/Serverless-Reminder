import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('auth')

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosTableUserIdIndex = process.env.TODOS_USERID_INDEX
  ) {}

  async getTodos(userId: string): Promise<TodoItem[]> {
    const queryParams = {
      TableName: this.todosTable,
      IndexName: this.todosTableUserIdIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }

    logger.info(`User: ${userId} fetched todos.`);

    const result = await this.docClient.query(queryParams).promise()
    return result.Items as TodoItem[]
  }

  async createTodo(item: TodoItem): Promise<TodoItem> {
    const createParams = {
      TableName: this.todosTable,
      Item: item
    }

    await this.docClient.put(createParams).promise()
    return item
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    const deleteParams = {
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }

    logger.info(`User: ${userId} deleted todo: ${todoId}.`);

    await this.docClient.delete(deleteParams).promise()
  }

  async updateTodo(
    userId: string,
    todoId: string,
    updatedTodo: TodoUpdate
  ): Promise<void> {
    const updateParams = {
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      },
      ExpressionAttributeNames: { "#N": "name" },
      UpdateExpression: "set #N=:todoName, dueDate=:dueDate, done=:done",
      ExpressionAttributeValues: {
        ':todoName': updatedTodo.name,
        ':done': updatedTodo.done,
        ':dueDate': updatedTodo.dueDate
      },
      ReturnValues: "UPDATED_NEW"
    }
    await this.docClient.update(updateParams).promise()

    return
  }

  async updateTodoItemImage(
    userId: string,
    todoId: string,
    imageUrl: string
  ): Promise<void> {
    const updateImageParams = {
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: 'set attachmentUrl = :imageUrl',
      ExpressionAttributeValues: {
        ':imageUrl': imageUrl
      }
    }
    await this.docClient.update(updateImageParams).promise()
    return
  }

}
