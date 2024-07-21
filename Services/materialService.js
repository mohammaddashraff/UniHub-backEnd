const db = require('../Utils/db')
const path = require('path');
const bucket = require('../Utils/firebaseConfig');
const fs = require('fs').promises;
const fs2 = require('fs');
const jwt = require("jsonwebtoken");
const { Storage } = require('@google-cloud/storage');
const {storage} = require("firebase-admin");

const uploadFileToFirebase = async (filePath, destination, mimetype) => {
    try {
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
             new Error(`File not found at ${filePath}`);
        }
        // Upload file to Firebase Storage
        await bucket.upload(filePath, {
            destination,
            metadata: {
                contentType: mimetype,
            },
        });
        const file = bucket.file(destination);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491', // Set a long expiration date
        });
        return url;
    } catch (error) {
        console.error('Error uploading file to Firebase:', error);
        throw error; // Re-throw the error to propagate it up to the caller
    }
}


const uploadFileAndInsertMetadata = async (req) => {
    const token = req.headers.authorization.split(' ')[1]; // Assuming the token is passed in the Authorization header
    return new Promise((resolve, reject) => {
        jwt.verify(token, 'unihubaammy', async (err, decoded) => {
            if (err) {
                reject(new Error('Token verification failed'));
            } else {
                const userId = decoded.id;
                const { courseId, materialName, materialDesc } = req.body;
                if (!courseId || !materialName || !materialDesc) {
                    reject(new Error('Course ID, Material Name, and Material Description are required'));
                }
                const query = 'select * from course where courseID = ?'
                db.query(query,[courseId],async (err, res) => {
                    if (res.length===0) {
                        reject(new Error('Course not available'))
                    } else{
                        const filePath = path.join(__dirname, 'uploads', req.file.filename);
                        console.log(`File path: ${filePath}`);
                        const destination = `materials/${courseId}/${req.file.filename}`;
                        try {
                            // Upload file to Firebase Storage using the new function
                            const url = await uploadFileToFirebase(filePath, destination, req.file.mimetype);
                            console.log(`Uploaded file URL: ${url}`);
                            // Clean up local file
                            // Insert file metadata into the database
                            db.execute(
                                'insert into material (link, materialName, materialDesc, uploadDate, courseId, userId) VALUES (?,?,?,NOW(),?,?)',
                                [url, materialName, materialDesc, courseId, userId]
                            );
                            if (fs2.existsSync(filePath)) {
                                fs2.unlinkSync(filePath);
                            } else {
                                console.error(`File does not exist at path: ${filePath}`);
                            }
                            resolve(url);
                        } catch (error) {
                            console.error(`Error during upload: ${error.message}`);
                            reject(new Error('Error uploading file'));
                        }
                    }
                })
            }
        });
    });
};

const editMaterial = (req, callback) => {
    const token = req.headers.authorization.split(' ')[1]; // Assuming token is passed in the Authorization header
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(new Error('Unauthorized'));
            return;
        }
        const userId = decoded.id;
        const { materialId, newLink } = req.body;
        db.query('SELECT userId, link FROM material WHERE materialId = ?', [materialId], (err, results) => {
            if (err) {
                callback(err);
                return;
            }
            if (results.length === 0) {
                callback(new Error('Material not found'));
                return;
            }
            const material = results[0];
            if (material.userId !== userId) {
                callback(new Error('Unauthorized to edit this material'));
                return;
            }
            if (!material.link) {
                callback(new Error('Material link is undefined'));
                return;
            }
            //console.log(material.link)
            const url = new URL(material.link);
            const oldDestination = url.pathname.substring(26);
            deleteFileFromFirebase(oldDestination, (err) => {
                if (err) {
                    callback(err);
                    return;
                }
                const filePath = path.join(__dirname, 'uploads', req.file.filename);
                const destination = `materials/${material.courseId}/${req.file.filename}`;
                uploadFileToFirebase(filePath, destination, req.file.mimetype, (err, url) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    db.execute('UPDATE material SET link = ? WHERE materialId = ?', [url, materialId], (err) => {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, 'Material link updated successfully');
                    });
                });
            });
        });
    });
};
const printMaterialForEachCourse = (courseId,callback)=>{
    const query = 'SELECT materialId, materialName, materialDesc, link, uploadDate FROM material WHERE courseId = ?';
    db.query(query,[courseId],(err,res)=>{
        if(err){
            callback(err,null)
        }else{
            callback(null,res)
        }
    })
}
const deleteLocalFile = (filePath) => {
    if (fs2.existsSync(filePath)) {
        fs2.unlinkSync(filePath);
    }
};
const editMaterialDesc = (materialId, newDesc, token, callback) => {
    try {
        jwt.verify(token, 'unihubaammy', (err, decoded) => {
            if (err) {
                callback(err, null);
                return;
            }
            const userId = decoded.id;

            // Verify user authorization
            db.query('SELECT userId FROM material WHERE materialId = ?', [materialId], (err, result) => {
                if (err) {
                    callback(err, null);
                    return;
                }

                const material = result[0];
                if (!material) {
                    callback(new Error('Material not found'), null);
                    return;
                }

                if (material.userId !== userId) {
                    callback(new Error('Unauthorized to edit this material'), null);
                    return;
                }

                const query = 'UPDATE material SET materialDesc = ? WHERE materialId = ?';
                db.query(query, [newDesc, materialId], (err, result) => {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, 'Material description updated successfully');
                    }
                });
            });
        });
    } catch (error) {
        callback(error, null);
    }
};
const deleteFileFromFirebase = (destination, callback) => {
    const file = bucket.file(destination);
    file.delete((err) => {
        if (err) {
            console.error('Error deleting file from Firebase:', err);
            callback(err);
        } else {
            console.log(`Successfully deleted ${destination} from Firebase`);
            callback(null);
        }
    });
};

const deleteMaterial = (materialId, req, callback) => {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(new Error('Token verification failed'), null);
            return;
        }
        const userId = decoded.id;
        db.query('SELECT userId, link FROM material WHERE materialId = ?', [materialId], (err, result) => {
            if (err) {
                callback(err, null);
                return;
            }
            const material = result[0];
            if (!material) {
                callback(new Error('Material not found'), null);
                return;
            }
            if (material.userId !== userId) {
                callback(new Error('Unauthorized to delete this material'), null);
                return;
            }
            if (!material.link || typeof material.link !== 'string') {
                callback(new Error('Material link is missing or invalid'), null);
                return;
            }
            const url = new URL(material.link);
            const path = url.pathname.substring(26);
            deleteFileFromFirebase(path, (firebaseErr) => {
                if (firebaseErr) {
                    callback(firebaseErr, null);
                    return;
                }
                db.execute('DELETE FROM material WHERE materialId = ?', [materialId], (dbErr, result) => {
                    if (dbErr) {
                        callback(dbErr, null);
                    } else {
                        callback(null, 'Material deleted successfully');
                    }
                });
            });
        });
    });
};


module.exports = {
    uploadFileAndInsertMetadata,
    printMaterialForEachCourse,
    editMaterial,
    editMaterialDesc,
    deleteMaterial,
}