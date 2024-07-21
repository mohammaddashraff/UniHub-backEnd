const db = require('./database.js')
const jwt = require("jsonwebtoken");
const {query} = require("express");
const createTask = (taskData,token,callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            // Token verification failed
            callback(err, null);
        } else {
            // Token verification succeeded, proceed with fetching profile
            const userId = decoded.id;
            const {taskName, taskDesc, dueDate} = taskData
            const query = `insert into tasks (userid, taskName, taskDesc, status, dueDate) VALUES (?,?,?,0,?,?)`
            db.query(query,[userId,taskName,taskDesc,status,dueDate],(err,res)=>{
                if(err){
                    callback(err,null)
                }else{
                    callback(null,'Task created successfully')
                }
            })
        }
    })
}
const deleteTask = (taskData,callback) => {
    const query = 'delete from tasks where taskName = ?'
    db.query(query,[taskData],(err,res)=>{
        if(err){
            callback(err,null)
        }else{
            callback(null,'Task deleted successfully')
        }
    })
}
const listTasks = (token,callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            // Token verification failed
            callback(err, null);
        } else {
            const userId = decoded.id;
            const query = 'select * from tasks where taskId = ?'
            db.query(query,[userId],(err,res)=>{
                if(err){
                    callback(err,null)
                }
                else{
                    callback(null,res)
                }
            })
        }
    })
}
/*
* tasks if 1 is completed
* //    if 0 is pending
* //    if 2 it means that the due date has passed
* */

const markAsCompleted = (taskId,callback) => {
    const query ='update tasks set status = 1 where taskId = ?'
    db.query(query,[taskId],(err,res)=>{
        if(err){
            callback(null,err)
        }else{
            callback(res,null)
        }
    })
}


module.exports= {
    createTask,
    deleteTask,
    listTasks,
    markAsCompleted,
}