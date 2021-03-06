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

import { createTodo, deleteTodo, getDiscoverTodos, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

import {
  DateTimeInput,
} from 'semantic-ui-calendar-react';

interface TodosProps {
  auth: Auth
  history: History
  isDiscover?: boolean
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  newTodoPriority: number
  loadingCreate: boolean
  dueDate: string
  newTodoLock: boolean
  discoverTodos: Todo[]
  searchText: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    newTodoPriority: 2,
    loadingTodos: true,
    loadingCreate: false,
    dueDate: '',
    newTodoLock: true,
    discoverTodos: [],
    searchText: ''
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchText: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  searchDiscover = async () => {
    const discoverTodos = await getDiscoverTodos(this.props.auth.getIdToken(), this.state.searchText);
    this.setState({
      discoverTodos: discoverTodos.filter(t => !!t.todoId),
    })
  }

  onTodoCreate = async () => {
    try {
      var dueDate = ""
      if (!!this.state.dueDate) {
        var date = this.state.dueDate.split(" ")[0].split(".")
        var time = this.state.dueDate.split(" ")[1].split(":")
        dueDate = new Date(Number(date[2]), Number(date[1]) - 1, Number(date[0]), Number(time[0]), Number(time[1])).getTime() as unknown as string
      }
      this.setState({ ...this.state, loadingCreate: true })
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate: dueDate,
        priority: this.state.newTodoPriority,
        lock: !this.state.newTodoLock
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: '',
        loadingCreate: false,
        newTodoPriority: 2,
        dueDate: "",
        newTodoLock: true
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
      const discoverTodos = await getDiscoverTodos(this.props.auth.getIdToken())
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        discoverTodos: discoverTodos.filter(t => !!t.todoId),
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
        {!this.props.isDiscover ? this.renderCreateTodoInput() : this.renderDiscoverInput()}

        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>

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
            <Button onClick={() => this.setState({ ...this.state, newTodoLock: !this.state.newTodoLock })}
              style={{ backgroundColor: "white", border: "solid 1px", borderColor: "#d3d3d3", borderLeft: 0 }} icon>
              <i className={this.state.newTodoLock ? "lock icon" : "lock open icon"} style={{ color: this.state.newTodoLock ? "red" : "green" }}></i>
            </Button>
            <input style={{ borderRadius: 0 }} />
            <DateTimeInput
              name="dueDate"
              placeholder="Due Date"
              value={this.state.dueDate}
              iconPosition="left"
              dateFormat="DD.MM.yyyy"
              closable
              onChange={(event, { value }) => {
                this.setState({ ...this.state, dueDate: value });
              }}
            />
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
      </Grid.Row>
    )
  }

  renderDiscoverInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            fluid
            actionPosition="left"
            placeholder="Anything..."
            value={this.state.searchText}
            onChange={this.handleSearchTextChange}
          >
            <Button
              loading={this.state.loadingCreate}
              icon
              labelPosition='right'
              style={{ backgroundColor: "teal", color: "white" }}
              onClick={this.searchDiscover}
            >
              <Icon name='search' style={{ color: "white" }} />Search</Button>
            <input style={{ borderRadius: 0 }} />
          </Input>
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
          Loading Reminders
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {
          (this.props.isDiscover ? this.state.discoverTodos : this.state.todos).map((todo, pos) => {
            return (
              <Grid.Row key={todo.todoId} style={{ display: "flex", alignItems: "center", paddingTop: 0 }}>
                {!this.props.isDiscover && <Grid.Column width={1} >
                  <Checkbox
                    onChange={() => this.onTodoCheck(pos)}
                    checked={todo.done}
                  />
                </Grid.Column>}

                <Grid.Column width={1} >
                  {todo.lock ?
                    <i className={"lock open icon"} style={{ color: "green" }}></i> : ""}
                </Grid.Column>
                <Grid.Column width={6} >
                  {todo.name}
                </Grid.Column>
                <Grid.Column width={3} floated="right" style={{ color: this.isExpired(todo.dueDate) && "red" }}>
                  {!!todo.dueDate ? dateFormat(new Date(todo.dueDate), 'dd.mm.yyyy HH:mm') as string : ""}
                </Grid.Column>
                <Grid.Column width={3} floated="right">
                  {this.priorityResolver(Number(todo.priority))}
                </Grid.Column>
                {!this.props.isDiscover && <Grid.Column width={2} floated="right">
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
                </Grid.Column>}

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
