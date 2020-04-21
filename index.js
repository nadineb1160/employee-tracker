const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const util = require("util");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "employeeDB"
});

connection.connect(function (err) {
    console.log("connection established!")
    if (err) throw err;
    start();
});

connection.query = util.promisify(connection.query);

// ---------- START ------------

function start() {
    inquirer.prompt([
        {
            type: "list",
            name: "options",
            message: "What would you like to review?",
            choices: ["Employees", "Department", "Roles"]
        }

    ]).then(function (answers) {
        switch (answers.options) {
            case "Employees":
                changeEmployee();
                break;
            case "Departments":
                changeDepartment();
                break;
            case "Roles":
                changeRole();
                break;
        }
    });
}

// ---------- VIEW ALL ------------

function viewAll(type) {
    connection.query(`SELECT * FROM ${type}`, function (err, res) {
        if (err) throw err;
        const table = cTable.getTable(res)
        console.log(table);
        start();
    })
}

// ---------- CHANGE EMPLOYEE ------------

function changeEmployee() {
    inquirer.prompt([
        {
            type: "list",
            name: "options",
            message: "What would you like to do?",
            choices: ["View All Employees", "View All Employees By Department", "View All Employees By Manager", "Add Employee", "Remove Employee", "Update Employee Role", "Update Employee Manager"]
        }

    ]).then(function (answer) {
        switch (answer.options) {
            case "View All Employees":
                viewAll("employees");
                break;
            case "View All Employees By Department":
            case "View All Employees By Manager":
            case "Add Employee":
                addEmployee();
                break;
            case "Remove Employee":
            case "Update Employee Role":
            case "Update Employee Manager":

        }
    })
}


async function addEmployee() {
    let roleChoices = await populate("title", "roles");
    let managerChoices = await populateManagers();
    inquirer.prompt([
        {
            name: "firstName",
            message: "What is the employee's first name?"
        },
        {
            name: "lastName",
            message: "What is the employee's last name?"
        },
        {
            type: "list",
            name: "role",
            message: "What is the employee's role?",
            choices: roleChoices
        },
        {
            type: "list",
            name: "manager",
            message: "Who is the employee's manager?",
            choices: managerChoices
        }

    ]).then(function (answers) {

        queryRole(answers);

        // // console.log(roleID)
        // var query = "INSERT INTO employees SET ?";
        // connection.query(query, {
        //     first_name: answers.firstName,
        //     last_name: answers.lastName,
        //     role_id: roleID, // get id from role
        //     manager_id: answers.manager // get id from manager
        // }, function(err) {
        //     if (err) throw err;
        // });

        viewAll("employees");
    })
}

async function queryRole(answers) {
    var queryRole = `SELECT role_id FROM roles WHERE title = "${answers.role}"`;
    var res = await connection.query(queryRole)
    .catch(function(err) {
        throw err;
    });

    let roleID = res[0].role_id;

    // Select manager_id from employees where employee_id = manager_id
    var managerID = await getManager(answers.manager);

    // console.log(roleID)
    var query = "INSERT INTO employees SET ?";
    connection.query(query, {
        first_name: answers.firstName,
        last_name: answers.lastName,
        role_id: roleID, // get id from role
        manager_id: managerID // get id from manager
    }, function (err) {
        if (err) throw err;
    });


}

// Get Manager from id
async function getManager(name) {
    let nameSplit = name.split(" ");
    let queryManager = `SELECT employee_id FROM employees WHERE first_name = '${nameSplit[0]}' AND last_name = '${nameSplit[1]}'`;
    var result = await connection.query(queryManager)
    .catch(function (err) {
        throw err;
    });
    // console.log(result);
    return result[0].employee_id;
}

// ---------- CHANGE DEPARTMENT ------------

function changeDepartment() {
    inquirer.prompt([
        {
            type: "list",
            name: "options",
            message: "What would you like to do?",
            choices: ["View All Departments", "Add Department", "Remove Department", "Update Department"]
        }

    ]).then(function (answer) {
        switch (answer.options) {
            case "View All Departments":
                viewAllDepartments("departments");
                break;
            case "Add Department":
                break;
            case "Remove Department":
                break;
            case "Update Department":
                break;

        }
    })
}

// ---------- CHANGE ROLE ------------

function changeRole() {
    inquirer.prompt([
        {
            type: "list",
            name: "options",
            message: "What would you like to do?",
            choices: ["View All Roles", "Add Roles", "Remove Roles", "Update Roles"]
        }

    ]).then(function (answer) {
        switch (answer.options) {
            case "View All Roles":
                viewAll("departments");
                break;
            case "Add Roles":
                break;
            case "Remove Roles":
                break;
            case "Update Roles":
                break;

        }
    })
}

async function populate(col, table) {
    options = [];

    var query = `SELECT ${col} FROM ${table}`;
    var res = await connection.query(query);
    // console.log(res);
    for (let i = 0; i < res.length; i++) {
        options.push(res[i].title);
        // console.log(res[i].title)
    }

    // var res = connection.query(query, function (err, res) {
    //     if (err) throw err;

    //     // console.log(res);
    //     for (let i = 0; i < res.length; i++) {
    //         options.push(res[i].title);
    //         // console.log(res[i].title)
    //     }
    //     // console.log(options);
    // })
    // update and delete
    return options;

}

async function populateManagers() {
    options = []

    var query = "SELECT first_name, last_name FROM employees WHERE manager_id is null";
    var res = await connection.query(query)
        .catch(function (err) {
            throw err;
        });

    // console.log(res);
    for (let i = 0; i < res.length; i++) {
        options.push(res[i].first_name + " " + res[i].last_name);
        // console.log(res[i].title)
    }
    console.log(options);
    // update and delete
    return options
}