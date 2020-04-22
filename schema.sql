DROP DATABASE IF EXISTS employeeDB;
CREATE database employeeDB;

USE employeeDB;

CREATE TABLE departments (
    department_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(30) NOT NULL,
    PRIMARY KEY (department_id)
);

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT NOT NULL,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    department_id INT(10) NULL,
    FOREIGN KEY (department_id) REFERENCES departments (department_id),
    PRIMARY KEY (role_id)
);

CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT NOT NULL,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INT(10) NOT NULL, 
    manager_id INT(10) NULL,
    FOREIGN KEY (role_id) REFERENCES roles (role_id),
    FOREIGN KEY (manager_id) REFERENCES employees (employee_id),
    PRIMARY KEY (employee_id)
);