# Employee Management System

This application allows you to manage a company's employees by creating an employee database that stores information on employees, roles and departments in tables. The user is prompted on the command line to change, read, update or delete (CRUD) from these categories.

![schema](Assets/Images/schema.png)

Technologies:

- Node
- Inquirer
- MySQL
- Javascript

## How to Join All Three Tables

```
var queryChart = "SELECT e.employee_id, e.first_name, e.last_name, r.title, d.name AS departmentName, concat(m.first_name, ' ', m.last_name) AS ManagerName ";

queryChart += "FROM (((employees e LEFT JOIN roles r ON e.role_id = r.role_id) ";
queryChart += "LEFT JOIN departments d ON r.department_id = d.department_id) ";
queryChart += "LEFT JOIN employees m ON e.manager_id = m.employee_id)";

```

### Installation:

```
npm install
```

### Usage:

To start use:

```
node index.js
```

Then answer the given prompts:

![CL Demo](/demo/CL_demo.gif)

## Author

Nadine Bundschuh

- Github: nadineb1160
- [GitHub URL](https://github.com/nadineb1160)
- [LinkedIn](https://www.linkedin.com/in/nadine-bundschuh-731233b9)
