import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const todoAccess = new TodoAccess()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  return todoAccess.getTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const itemId = uuid.v4()

  return await todoAccess.createTodo({
    todoId: itemId,
    userId: userId,
    done: false,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    createdAt: new Date().toISOString(),
    priority: createTodoRequest.priority ?? 1
  })
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<void> {
  return await todoAccess.updateTodo(userId, todoId, {
    name: updateTodoRequest.name,
    done: updateTodoRequest.done,
    dueDate: updateTodoRequest.dueDate,
    priority: updateTodoRequest.priority
  })
}

export async function deleteTodo(
  userId: string,
  todoId: string
): Promise<void> {
  return await todoAccess.deleteTodo(userId, todoId)
}

export async function updateTodoItemImage(
  userId: string,
  todoId: string,
  imageUrl: string
): Promise<void> {
  return todoAccess.updateTodoItemImage(userId, todoId, imageUrl)
}
