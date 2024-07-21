const db = require('../Utils/db');
const jwt = require('../Utils/jwt');

// ALTER TABLE tasks
// ADD COLUMN dueTime TIME DEFAULT NULL;

const createTaskService = (taskData, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err);
            callback({ message: 'Token verification failed', status: 401 });
            return;
        }

        const userId = decoded.id;
        const { taskName, taskDesc, dueDate, dueTime } = taskData;

        const status = 0; // Default status for new tasks
        const query = `INSERT INTO tasks (userId, taskName, taskDesc, status, dueDate, dueTime) VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(query, [userId, taskName, taskDesc, status, dueDate, dueTime], (err, res) => {
            if (err) {
                console.error('Error inserting task:', err);
                callback({ message: 'Database query error', status: 500 });
            } else {
                callback(null, { message: 'Task created successfully', status: 201 });
            }
        });
    });
};

/*
* tasks if 1 is completed
* //    if 0 is pending
* //    if 2 it means that the due date has passed
* */

// Delete a task by task name
const deleteTaskService = (taskName, token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err);
            callback({ message: 'Token verification failed', status: 401 });
            return;
        }

        const userId = decoded.id;
        const query = 'DELETE FROM tasks WHERE taskName = ? AND userId = ?';
        db.query(query, [taskName, userId], (err, res) => {
            if (err) {
                console.error('Error deleting task:', err);
                callback({ message: 'Database query error', status: 500 });
            } else if (res.affectedRows === 0) {
                callback({ message: 'Task not found or unauthorized', status: 404 });
            } else {
                callback(null, { message: 'Task deleted successfully', status: 200 });
            }
        });
    });
};

// List tasks for a user based on token
const listTasksService = (token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
        } else {
            const userId = decoded.id;
            const query = 'SELECT * FROM tasks WHERE userId = ?';
            db.query(query, [userId], (err, res) => {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, res);
                }
            });
        }
    });
};

// Mark a task as completed by task ID
const markAsCompletedService = (taskId, callback) => {
    const query = 'UPDATE tasks SET status = 1 WHERE taskId = ?';
    db.query(query, [taskId], (err, res) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, 'Task marked as completed successfully');
        }
    });
};

module.exports = {
    createTaskService,
    deleteTaskService,
    listTasksService,
    markAsCompletedService
};
