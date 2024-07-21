const { createTaskService, deleteTaskService, listTasksService, markAsCompletedService } = require('../Services/taskService');

// Controller function to create a task
const createTask = (req, res) => {
    const { taskName, taskDesc, dueDate, dueTime } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    createTaskService({ taskName, taskDesc, dueDate, dueTime }, token, (err, result) => {
        if (err) {
            return res.status(err.status || 500).json({ error: err.message });
        }
        res.status(result.status || 200).json({ message: result.message });
    });
};

// Controller function to delete a task
const deleteTask = (req, res) => {
    const { taskName } = req.body;
    const token = req.headers.authorization.split(' ')[1];

    deleteTaskService(taskName, token, (err, result) => {
        if (err) {
            // Handle errors
            console.error('Delete task error:', err);
            return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
        }
        // On success
        return res.status(result.status || 200).json({ message: result.message });
    });
};

// Controller function to list tasks for a user
const listTasks = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    listTasksService(token, (err, tasks) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to list tasks', details: err.message });
        }
        res.status(200).send(tasks);
    });
};

// Controller function to mark a task as completed
const markTaskAsCompleted = (req, res) => {
    const { taskId } = req.body;

    if (!taskId) {
        return res.status(400).send({ error: 'Task ID is required' });
    }

    markAsCompletedService(taskId, (err, result) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to mark task as completed', details: err.message });
        }
        res.status(200).send({ message: 'Task marked as completed' });
    });
};

module.exports = {
    createTask,
    deleteTask,
    listTasks,
    markTaskAsCompleted
};
