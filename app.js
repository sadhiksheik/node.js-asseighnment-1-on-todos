const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatus = (query) => {
  return query.priority !== undefined && query.status !== undefined;
};

const hasPriority = (query) => {
  return query.priority !== undefined;
};

const hasStatus = (query) => {
  return query.status !== undefined;
};

const hasCategoryAndStatus = (query) => {
  return query.category !== undefined && query.status !== undefined;
};

const hasCategory = (query) => {
  return query.category !== undefined;
};

const hasCategoryAndPriority = (query) => {
  return query.category !== undefined && query.priority !== undefined;
};

const priorityList = ["HIGH", "MEDIUM", "LOW"];
const statusList = ["TO DO", "IN PROGRESS", "DONE"];
const categoryList = ["WORK", "HOME", "LEARNING"];

getFormattedData = (todos) => {
  const obj = todos.map((todo) => ({
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  }));
  return obj;
};

// API 1 GET Todos
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let getToDosQuery = null;

  switch (true) {
    case hasStatus(request.query):
      const result = statusList.includes(status);
      if (result) {
        getTodosQuery = `
                    select
                        * 
                    from 
                        todo 
                    where 
                        todo LIKE '%${search_q}%'
                        AND status = '${status}';`;

        const todos = await db.all(getTodosQuery);
        const finalTodos = getFormattedData(todos);
        return response.send(finalTodos);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasPriority(request.query):
      const result2 = priorityList.includes(priority);
      if (result2) {
        getTodosQuery = ` 
                        SELECT 
                            *
                        FROM
                            todo
                        WHERE 
                            todo LIKE '%${search_q}%'
                            AND priority = '${priority}';`;
        const todos = await db.all(getTodosQuery);
        const finalTodos = getFormattedData(todos);
        return response.send(finalTodos);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasPriorityAndStatus(request.query):
      const priorityResult1 = priorityList.includes(priority);
      const statusResult1 = statusList.includes(status);
      const FinalResult1 = priorityResult && statusResult;
      if (FinalResult1) {
        getTodosQuery = `
                        SELECT 
                            *
                        FROM 
                            todo
                        WHERE 
                            todo LIKE '%${search_q}%'
                            AND status = '${status}'
                            AND priority = '${priority}';`;
        const todos = await db.all(getTodosQuery);
        const finalTodos = getFormattedData(todos);
        return response.send(finalTodos);
      } else if (priorityResult1) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (statusResult1) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatus(request.query):
      const categoryResult2 = categoryList.includes(category);
      const statusResult2 = statusList.includes(status);
      const FinalResult2 = statusResult && categoryResult;

      if (FinalResult2) {
        getTodosQuery = `
                        SELECT 
                            *
                        FROM 
                            todo
                        WHERE 
                            todo LIKE '%${search_q}%'
                            AND status = '${status}'
                            AND category = '${category}';`;
        const todos = await db.all(getTodosQuery);
        return response.send(todos);
      } else if (categoryResult2) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (statusResult2) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategory(request.query):
      const result3 = categoryList.includes(category);
      if (result3) {
        getTodosQuery = ` 
                        SELECT 
                            *
                        FROM
                            todo
                        WHERE 
                            todo LIKE '%${search_q}%'
                            AND category = '${category}';`;
        const todos = await db.all(getTodosQuery);
        const finalTodos = getFormattedData(todos);
        return response.send(finalTodos);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(request.query):
      const categoryResult4 = categoryList.includes(category);
      const priorityResult4 = priorityList.includes(priority);
      const FinalResult4 = priorityResult && categoryResult;
      if (FinalResult4) {
        getTodosQuery = `
                        SELECT 
                            *
                        FROM 
                            todo
                        WHERE 
                            todo LIKE '%${search_q}%'
                            AND priority = '${priority}'
                            AND category = '${category}';`;
        const todos = await db.all(getTodosQuery);
        const finalTodos = getFormattedData(todos);
        return response.send(finalTodos);
      } else if (categoryResult4) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else if (priorityResult4) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    default:
      getTodosQuery = ` 
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE 
                        todo LIKE '%${search_q}%';`;
      const todos = await db.all(getTodosQuery);
      const finalTodos = getFormattedData(todos);
      return response.send(finalTodos);
  }
});

// API 2 GET specific Todo
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = ` 
        SELECT
            *
        FROM
            todo
        WHERE
            id = ${todoId};`;
  const todoObj = await db.get(getTodoQuery);
  const finalObj = {
    id: todoObj.id,
    todo: todoObj.todo,
    priority: todoObj.priority,
    status: todoObj.status,
    category: todoObj.category,
    dueDate: todoObj.due_date,
  };
  response.send(finalObj);
});

// API 3 get todo on specific date
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const isValidDate = isValid(new Date(date));

  if (isValidDate === true) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const getTodosQuery = `
        select * from todo where due_date='${formattedDate}';
    `;
    const todoList = await db.all(getTodosQuery);
    response.send(getFormattedData(todoList));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4 POST a todo
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  const isValidDate = isValid(new Date(dueDate));
  if (priorityList.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (statusList.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (categoryList.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValidDate === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
    const createTodoQuery = ` 
    INSERT INTO
        todo (id, todo, priority, status,category,due_Date)
     VALUES
        (${id}, '${todo}', '${priority}', '${status}','${category}','${formattedDate}');`;
    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
});

// API 5 Update a todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const detailsTobeUpdated = request.body;
  let updateColumn = "";

  switch (true) {
    case detailsTobeUpdated.status !== undefined:
      updateColumn = "Status";
      break;

    case detailsTobeUpdated.priority !== undefined:
      updateColumn = "Priority";
      break;

    case detailsTobeUpdated.todo !== undefined:
      updateColumn = "Todo";
      break;

    case detailsTobeUpdated.category !== undefined:
      updateColumn = "Category";
      break;

    case detailsTobeUpdated.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const getRequiredTodoQuery = `
    SELECT
        *
     FROM
        todo
     WHERE id = ${todoId};`;
  const requiredTodo = await db.get(getRequiredTodoQuery);
  // console.log(requiredTodo);

  const {
    todo = requiredTodo.todo,
    status = requiredTodo.status,
    priority = requiredTodo.priority,
    category = requiredTodo.category,
    dueDate = requiredTodo.due_date,
  } = request.body;
  const isDateValid = isValid(new Date(dueDate));

  if (priorityList.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (statusList.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (categoryList.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isDateValid === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const updateTodoQuery = ` 
    UPDATE 
        todo
     SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
         due_date = '${dueDate}'
    WHERE
        id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  }
});

// API 6 DELETE a Todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM 
        todo 
     WHERE 
        id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
