import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import {  updateTodo } from '../../businessLogic/todoLogic'
import { getUserId } from '../utils'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'


export const handler = middy( async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  await updateTodo(userId, todoId, updatedTodo)
  
  return {
    statusCode: 204,
    body: JSON.stringify({})
  }
})

handler.use(
  cors({
    credentials: true
  })
)
