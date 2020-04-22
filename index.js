const mysql = require("mysql");
const inquirer = require("inquirer");
const Table = require("cli-table");
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

// ************************
// ********* START ********
// ************************

function start() {

    console.log("\n=============================")
    console.log("------ EMPLOYEE TRACKER -----");
    console.log("=============================\n")

    inquirer.prompt([
        {
            type: "list",
            name: "options",
            message: "What would you like to review?",
            choices: ["View All", "Employees", "Roles", "Departments", "Exit"]
        }
    ]).then(function (answers) {
        switch (answers.options) {
            case "View All":
                viewJoinedChart();
                break;
            case "Employees":
                changeEmployee();
                break;
            case "Roles":
                changeRole();
                break;
            case "Departments":
                changeDepartment();
                break;
            case "Exit":
            default:
                connection.end();
        }
    });
}

function viewTable(type) {

    console.log(`\n ***** ${type.toUpperCase()} TABLE ***** \n`);

    connection.query(`SELECT * FROM ${type}`, function (err, res) {
        if (err) throw err;
        const table = cTable.getTable(res)
        console.table(table);
        start();
    });
}


function viewJoinedChart() {

    var queryChart = "SELECT e.employee_id, e.first_name, e.last_name, r.title, d.name AS departmentName, concat(m.first_name, ' ', m.last_name) AS ManagerName "
    queryChart += "FROM (((employees e LEFT JOIN roles r ON e.role_id = r.role_id) LEFT JOIN departments d ON r.department_id = d.department_id) LEFT JOIN employees m ON e.manager_id = m.employee_id)";

    connection.query(queryChart, function (err, res) {
        if (err) throw err;
        var table = new Table({
            head: ["ID", "First Name", "Last Name", "Title", "Department Name", "Manager Name"],
            colWidths: [5, 15, 15, 20, 20, 20]
        });
        res.forEach((row) => {

            if (row.ManagerName === null) {
                row.ManagerName = "N/A";
            }
            table.push([row.employee_id, row.first_name, row.last_name, row.title, row.departmentName, row.ManagerName]);
        });

        console.log(table.toString());
        start();
    })
}

// ************************
// ******* EMPLOYEE *******
// ************************

function changeEmployee() {

    console.log("\n=============================")
    console.log("------ CHANGE EMPLOYEE ------");
    console.log("=============================\n")

    inquirer.prompt([
        {
            type: "list",
            name: "options",
            message: "What would you like to do?",
            choices: ["View All Employees", "View All Employees By Role", "View All Employees By Manager", "Add Employee", "Remove Employee", "Update Employee Role", "Update Employee Manager", "Display Options"]
        }
    ]).then(function (answer) {
        switch (answer.options) {
            case "View All Employees":
                viewTable("employees");
                break;
            case "View All Employees By Role":
                viewEmployeesByRole();
                break;
            case "View All Employees By Manager":
                viewEmployeesByManager();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Remove Employee":
                populateEmployee(remove);
                break;
            case "Update Employee Role":
                populateEmployee(updateEmployeeRole);
                break;
            case "Update Employee Manager":
                populateEmployee(updateEmployeeManager);
                break;
            case "Display Options":
            default:
                start();
                break;
        }
    });
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
    ]).then(async function (answers) {
        var roleID = await getRoleID(answers.role);
        var managerID = await getEmployeeID(answers.manager);

        var query = "INSERT INTO employees SET ?";
        connection.query(query, {
            first_name: answers.firstName,
            last_name: answers.lastName,
            role_id: roleID,
            manager_id: managerID
        }, function (err) {
            if (err) throw err;
        });

        viewTable("employees");
    })
}


async function remove(list) {
    inquirer.prompt([
        {
            name: "delete",
            type: "list",
            choices: list,
            message: "Who would you like to remove from the team?"
        }
    ]).then(async function (answer) {
        var employeeID = await getEmployeeID(answer.delete);

        var queryString = "DELETE FROM employees WHERE ?"
        await connection.query(queryString, {
            employee_id: employeeID
        })
            .catch(function (err) {
                if (err) throw err;
            });
        
        viewTable("employees");
    })
}


async function updateEmployeeRole(list) {
    let roleChoices = await populate("title", "roles");
    inquirer.prompt([
        {
            type: "list",
            name: "employee",
            choices: list,
            message: "Who would you like to update from the team?"
        },
        {
            type: "list",
            name: "role",
            message: "Update role:",
            choices: roleChoices
        }
    ]).then(async function (answers) {
        var roleID = await getRoleID(answers.role);
        var employeeID = await getEmployeeID(answers.employee);

        var queryString = "UPDATE employees SET role_id = ? WHERE employee_id = ?"
        await connection.query(queryString, [roleID, employeeID])
            .catch(function (err) {
                if (err) throw err;
            });
        viewTable("employees");
    });
}


async function updateEmployeeManager(list) {
    let managerChoices = await populateManagers();
    inquirer.prompt([
        {
            type: "list",
            name: "employee",
            choices: list,
            message: "Who would you like to update from the team?"
        },
        {
            type: "list",
            name: "manager",
            message: "Update manager:",
            choices: managerChoices
        }
    ]).then(async function (answers) {
        var managerID = await getEmployeeID(answers.manager);
        var employeeID = await getEmployeeID(answers.employee);

        var queryString = "UPDATE employees SET manager_id = ? WHERE employee_id = ?"
        await connection.query(queryString, [managerID, employeeID])
            .catch(function (err) {
                if (err) throw err;
            });
        viewTable("employees");
    });
}


async function viewEmployeesByManager() {
    let managerChoices = await populateManagers();

    inquirer.prompt([
        {
            type: "list",
            name: "manager",
            message: "View Employees By Manager:",
            choices: managerChoices
        }
    ]).then(async function (answer) {
        let employeeID = await getEmployeeID(answer.manager);
        
        var query = "SELECT first_name, last_name FROM employees WHERE manager_id = ?"
        var res = await connection.query(query, [employeeID])
            .catch(function (err) {
                if (err) throw err;
            });
        
        const table = cTable.getTable(res);
        console.table(table);
        start();
    });
}


// ************************
// ********* ROLE *********
// ************************

function changeRole() {

    console.log("\n=============================")
    console.log("-------- CHANGE ROLE --------");
    console.log("=============================\n")

    inquirer.prompt([
        {
            type: "list",
            name: "options",
            message: "What would you like to do?",
            choices: ["View All Roles", "Add Roles", "Remove Roles", "Update Roles", "Display Options"]
        }
    ]).then(function (answer) {
        switch (answer.options) {
            case "View All Roles":
                viewTable("roles");
                break;
            case "Add Roles":
                addRole();
                break;
            case "Remove Roles":
                populateRole(removeRole);
                break;
            case "Update Roles":
                populateRole(updateRole);
                break;
            case "Display Options":
            default:
                start();
                break;

        }
    });
}


async function addRole() {
    let departmentChoices = await populate("name", "departments");
    inquirer.prompt([
        {
            name: "name",
            message: "What is the role title?"
        },
        {
            name: "salary",
            message: "What is the yearly salary?"
        },
        {
            type: "list",
            name: "department",
            message: "Which department is this role in?",
            choices: departmentChoices
        }
    ]).then(async function (answers) {
        let depID = await getDepartmentID(answers.department);

        var query = "INSERT INTO roles SET ?";
        await connection.query(query, {
            title: answers.name,
            salary: answers.salary,
            department_id: depID
        }).catch(function (err) {
            if (err) throw err;
        });

        viewTable("roles");
    });
}


async function removeRole(roleChoices) {
    inquirer.prompt([{
        name: "delete",
        type: "list",
        choices: roleChoices,
        message: "Which role would you like to remove?"
    }]).then(async function (answer) {
        var roleID = await getRoleID(answer.delete);

        var queryString = "DELETE FROM roles WHERE role_id = ?"
        connection.query(queryString, roleID, function (err) {
            if (err) throw err;
            viewTable("roles");
        });
    });

}


async function updateRole(roleChoices) {
    let departmentChoices = await populate("name", "departments");
    inquirer.prompt([
        {
            type: "list",
            name: "role",
            choices: roleChoices,
            message: "Which role would you like to update?"
        },
        {
            name: "salary",
            message: "Update salary:"
        },
        {
            type: "list",
            name: "department",
            message: "Update department:",
            choices: departmentChoices
        }
    ]).then(async function (answers) {
        var roleID = await getRoleID(answers.role);
        var departmentID = await getDepartmentID(answers.department);

        var queryString = "UPDATE roles SET salary = ?, department_id = ? WHERE role_id = ?"
        await connection.query(queryString, [answers.salary, departmentID, roleID])
            .catch(function (err) {
                if (err) throw err;
            });
        viewTable("roles");
    });
}


async function viewEmployeesByRole() {

    let roleChoices = await populate("title", "roles");
    inquirer.prompt([
        {
            type: "list",
            name: "role",
            message: "View Employees By Role:",
            choices: roleChoices
        }
    ]).then(async function (answer) {
        let roleID = await getRoleID(answer.role);
        
        var query = "SELECT first_name, last_name FROM employees WHERE role_id = ?"
        var res = await connection.query(query, [roleID])
            .catch(function (err) {
                if (err) throw err;
            });
        
        const table = cTable.getTable(res);
        console.table(table);
        start();
    });
}


// ************************
// ****** DEPARTMENT ******
// ************************

function changeDepartment() {

    console.log("\n=============================")
    console.log("----- CHANGE DEPARTMENT -----");
    console.log("=============================\n")

    inquirer.prompt([
        {
            type: "list",
            name: "options",
            message: "What would you like to do?",
            choices: ["View All Departments", "Add Department", "Remove Department", "Update Department", "Display Options"]
        }
    ]).then(function (answer) {
        switch (answer.options) {
            case "View All Departments":
                viewTable("departments");
                break;
            case "Add Department":
                addDepartment();
                break;
            case "Remove Department":
                removeDepartment();
                break;
            case "Update Department":
                updateDepartment();
                break;
            case "Display Options":
            default:
                start();
                break;
        }
    })
}


function addDepartment() {
    inquirer.prompt([
        {
            name: "name",
            message: "What is the department's name?"
        }
    ]).then(async function (answers) {
        var query = "INSERT INTO departments SET ?";
        await connection.query(query, {
            name: answers.name,
        }).catch(function (err) {
            if (err) throw err;
        });

        viewTable("departments");
    });
}

async function removeDepartment() {
    let departmentChoices = await populate("name", "departments");
    inquirer.prompt([{
        name: "delete",
        type: "list",
        choices: departmentChoices,
        message: "Which department would you like to remove?"
    }]).then(async function (answer) {
        var departmentID = await getDepartmentID(answer.delete);

        var queryString = "DELETE FROM departments WHERE department_id = ?"
        connection.query(queryString, departmentID, function (err) {
            if (err) throw err;
            viewTable("departments");
        });
    });
}


async function updateDepartment() {
    let departmentChoices = await populate("name", "departments");
    inquirer.prompt([
        {
            type: "list",
            name: "department",
            choices: departmentChoices,
            message: "Which department would you like to update?"
        },
        {
            name: "name",
            message: "Update name of department:"
        },
    ]).then(async function (answers) {
        var departmentID = await getDepartmentID(answers.department);

        var queryString = "UPDATE departments SET name = ? WHERE department_id = ?"
        await connection.query(queryString, [answers.name, departmentID])
            .catch(function (err) {
                if (err) throw err;
            });
        viewTable("departments");
    });
}


// ************************
// ******* POPULATE *******
// ************************

async function populate(col, table) {
    var options = [];

    var query = `SELECT ${col} FROM ${table}`;
    var res = await connection.query(query)
        .catch(function (err) {
            if (err) throw err;
        });

    for (let i = 0; i < res.length; i++) {
        if (col === "name") {
            options.push(res[i].name);
        }
        else if (col === "title") {
            options.push(res[i].title);
        }
    }

    return options;
}


async function populateEmployee(crud) {
    var employees = [];

    var queryString = "SELECT first_name, last_name FROM employees"
    var res = await connection.query(queryString)
        .catch(function (err) {
            if (err) throw err;
        })

    for (var i = 0; i < res.length; i++) {
        employees.push(res[i].first_name + " " + res[i].last_name);
    }

    crud(employees);

}


async function populateRole(crud) {
    var roles = [];

    var queryString = "SELECT title FROM roles"
    var res = await connection.query(queryString)
        .catch(function (err) {
            if (err) throw err;
        })

    for (var i = 0; i < res.length; i++) {
        roles.push(res[i].title);
    }
    crud(roles);
}


async function populateManagers() {
    options = []

    var query = "SELECT first_name, last_name FROM employees WHERE manager_id is null";
    var res = await connection.query(query)
        .catch(function (err) {
            throw err;
        });

    for (let i = 0; i < res.length; i++) {
        options.push(res[i].first_name + " " + res[i].last_name);
    }
    options.push("Null"); // option if employee is manager

    return options
}


// ************************
// ******* GET IDS ********
// ************************

async function getEmployeeID(fullName) {
    // For managerID
    if (fullName === "Null") {
        return null;
    }
    let nameSplit = fullName.split(" ");
    let queryEmployee = `SELECT employee_id FROM employees WHERE first_name = '${nameSplit[0]}' AND last_name = '${nameSplit[1]}'`;
    var res = await connection.query(queryEmployee)
        .catch(function (err) {
            throw err;
        });

    return res[0].employee_id;
}

async function getRoleID(roleName) {
    var queryRole = `SELECT role_id FROM roles WHERE title = "${roleName}"`;
    var res = await connection.query(queryRole)
        .catch(function (err) {
            throw err;
        });

    return res[0].role_id;
}

async function getDepartmentID(departmentName) {
    var queryDepartment = `SELECT department_id FROM departments WHERE name = "${departmentName}"`;
    var res = await connection.query(queryDepartment)
        .catch(function (err) {
            throw err;
        });
    return res[0].department_id;
}
