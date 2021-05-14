import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  newTodoPriority: number
  loadingCreate: boolean
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    newTodoPriority: 2,
    loadingTodos: true,
    loadingCreate: false
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async () => {
    try {
      this.setState({ ...this.state, loadingCreate: true })
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate,
        priority: this.state.newTodoPriority
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: '',
        loadingCreate: false
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${e.message}`)
    }
  }

  handlePriority(priority: number) {
    this.setState({ ...this.state, newTodoPriority: priority })
  }

  render() {
    return (
      <div>
        <Header as="h1">Reminders</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            value={this.state.newTodoName}
            onChange={this.handleNameChange}
          >
            <Button
              loading={this.state.loadingCreate}
              icon
              labelPosition='left'
              style={{ backgroundColor: "teal", color: "white" }}
              onClick={this.onTodoCreate}
            >
              <Icon name='add' style={{ color: "white" }} />New Task</Button>
            <input style={{ borderRadius: 0 }} />
            <Button.Group style={{ border: "solid 1px", borderColor: "#d3d3d3", borderLeft: 0 }}>
              <Button onClick={() => this.handlePriority(1)}
                style={{ backgroundColor: this.state.newTodoPriority !== 1 && "white" }} icon>
                <i className="arrow up icon" style={{ color: "red" }}></i>
              </Button>
              <Button onClick={() => this.handlePriority(2)}
                style={{ backgroundColor: this.state.newTodoPriority !== 2 && "white" }} icon>
                <i className="minus icon" style={{ color: "gray" }}></i>
              </Button>
              <Button onClick={() => this.handlePriority(3)}
                style={{ backgroundColor: this.state.newTodoPriority !== 3 && "white" }} icon>
                <i className="arrow down icon" style={{ color: "green" }}></i>
              </Button>
            </Button.Group>
          </Input>
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }


  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId} style={{ display: "flex", alignItems: "center", paddingTop: 0 }}>
              <Grid.Column width={1} >
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={7} >
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right" style={{ color: this.isExpired(todo.dueDate) && "red" }}>
                {dateFormat(new Date(todo.dueDate), 'dd.mm.yyyy HH:mm') as string}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {this.priorityResolver(todo.priority)}
              </Grid.Column>
              <Grid.Column width={2} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {todo.attachmentUrl && (
                <Image src={todo.attachmentUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    return new Date().getTime() as unknown as string
  }

  isExpired(dueDate: string): boolean {
    var d1 = new Date().getTime()
    var d2 = new Date(dueDate).getTime()
    return d1 > d2
  }

  priorityResolver(priorty: number): React.ReactElement {
    switch (priorty) {
      case 1:
        return <i className="arrow up icon" style={{ color: "red" }}></i>
      case 2:
        return <i className="minus icon" style={{ color: "gray" }}></i>
      case 3:
        return <i className="arrow down icon" style={{ color: "green" }}></i>
      default:
        return <i className="minus icon" style={{ color: "gray" }}></i>
    }
  }
}
