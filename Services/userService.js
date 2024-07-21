const db = require('../Utils/db');
const bcrypt = require('../Utils/bcrypt');
const jwt = require('../Utils/jwt');
const nodemailer = require('../Utils/nodemailer');
const path = require('path');
const bucket = require('../Utils/firebaseConfig');
const fs = require('fs').promises;
const fs2 = require('fs');
const {Storage} = require('@google-cloud/storage');
const {storage} = require("firebase-admin");
const sharp = require('sharp');

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

const getUserPhotoService = (req,callback) => {
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, 'unihubaammy', async (err, decoded) => {
        if (err) {
            new Error('Token verification failed');
        } else {
            const userId = decoded.id;
            const query = 'select profilePhotoUrl from user where userID = ?'
            db.query(query,[userId],(err,res)=>{
                if(err){
                    callback(err,null)
                }else{
                    callback(null,res[0].profilePhotoUrl)
                }
            })
        }
    })
}

const getUsersService = (callback) => {
    const query = 'SELECT userID, firstName, lastName, userType, email, profilePhotoUrl FROM user';
    db.query(query, (err, res) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, res);
        }
    });
};


const uploadUserPhotoService = async (req) => {
    const token = req.headers.authorization.split(' ')[1];

    return new Promise((resolve, reject) => {
        jwt.verify(token, 'unihubaammy', async (err, decoded) => {
            if (err) {
                reject(new Error('Token verification failed'));
            } else {
                const userId = decoded.id;

                // Check if req.file is defined
                if (!req.file || !req.file.filename) {
                    reject(new Error('File not uploaded'));
                    return;
                }

                const filePath = path.join(__dirname, 'uploads', req.file.filename);
                const resizedFilePath = path.join(__dirname, 'uploads', `resized_${req.file.filename}`);

                try {
                    // Resize the photo
                    await sharp(filePath)
                        .resize(45, 40)
                        .toFile(resizedFilePath);

                    console.log(`Resized file path: ${resizedFilePath}`);
                    const destination = `userPhotos/${userId}/${req.file.filename}`;

                    // Upload resized file to Firebase Storage
                    const url = await uploadFileToFirebase(resizedFilePath, destination, req.file.mimetype);
                    console.log(`Uploaded file URL: ${url}`);

                    // Clean up local files
                    if (fs2.existsSync(filePath)) {
                        try {
                            await fs.access(filePath, fs.constants.W_OK); // Check write permission
                            fs2.unlinkSync(filePath);
                        } catch (unlinkError) {
                            console.error(`Error deleting original photo: ${unlinkError.message}`);
                        }
                    } else {
                        console.error(`Original photo does not exist at path: ${filePath}`);
                    }

                    if (fs2.existsSync(resizedFilePath)) {
                        try {
                            await fs.access(resizedFilePath, fs.constants.W_OK); // Check write permission
                            fs2.unlinkSync(resizedFilePath);
                        } catch (unlinkError) {
                            console.error(`Error deleting resized photo: ${unlinkError.message}`);
                        }
                    } else {
                        console.error(`Resized photo does not exist at path: ${resizedFilePath}`);
                    }

                    // Insert file metadata into the database
                    await db.execute(
                        'UPDATE user SET profilePhotoUrl = ? WHERE userID = ?',
                        [url, userId]
                    );

                    resolve(url);
                } catch (error) {
                    console.error(`Error during upload: ${error.message}`);
                    reject(new Error('Error uploading photo'));
                }
            }
        });
    });
};

const signUpService = (userData, callback) => {
    const {firstName, lastName, email, password, address, bDate, userType} = userData;
    const emailCheckQuery = 'SELECT COUNT(*) AS count FROM user WHERE email = ?';
    db.query(emailCheckQuery, [email], (emailCheckErr, emailCheckResult) => {
        if (emailCheckErr) {
            callback(emailCheckErr, null);
            return;
        }
        if (emailCheckResult[0].count > 0) {
            callback('Email already exists', null);
            return;
        }
        bcrypt.hash(password, 10, (err, hashed) => {
            if (err) {
                callback(err);
                return;
            }
            const insertUserQuery = 'INSERT INTO user (firstName, lastName, email, password, address, bDate, userType) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.query(insertUserQuery, [firstName, lastName, email, hashed, address, bDate, userType], (insertErr, insertResult) => {
                if (insertErr) {
                    callback(insertErr, null);
                } else {
                    callback(null, insertResult.insertId);
                }
            });
        });
    });
};

const signInService = (userData, callback) => {
    const {email, password} = userData;
    const getPasswordQuery = 'SELECT userID, password FROM user WHERE email = ?';
    db.query(getPasswordQuery, [email], (err, res) => {
        if (err) {
            callback(err);
            return;
        }
        if (res.length === 0) {
            // User not found
            const error = 'User not found';
            callback(error);
            return;
        }
        // Retrieve the hashed password from DB
        const hashedPassword = res[0].password;
        // Compare the stored hash with the password provided
        bcrypt.compare(password, hashedPassword, (err, bcryptRes) => {
            if (err) {
                callback(err);
                return;
            }
            // User found and password matched
            if (bcryptRes) {
                // Generate JWT token
                const userId = res[0].userID;
                const token = jwt.sign({id: userId}, 'unihubaammy', {expiresIn: '12h'});
                //Get userType
                const query = 'select userType from user where userID = ?'
                db.query(query, [userId], (err, res) => {
                    if (err) {
                        callback(err)
                    } else {
                        const userType = res[0].userType
                        callback(null, {message: 'success', token, userType});
                    }
                })
            } else {
                // Wrong credentials
                const error = 'Wrong credentials';
                callback(error);
            }
        });
    });
};

const deleteUserService = (token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
            return;
        }
        const userId = decoded.id;
        const query = 'DELETE FROM user WHERE userID = ?';
        db.query(query, [userId], (err, res) => {
            if (err) {
                callback('Failed to delete user', null);
            } else {
                callback(null, 'User deleted successfully');
            }
        });
    });
};

const editUserService = (token, userData, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            return callback(err, null);
        } else {
            const userId = decoded.id;
            const { firstName, lastName, email, password, address, bDate } = userData;
            const query = 'UPDATE user SET firstName = ?, lastName = ?, email = ?, password = ?, address = ?, bDate = ? WHERE userID = ?';

            const updateUser = (hashedPassword) => {
                db.query(query, [firstName, lastName, email, hashedPassword, address, bDate, userId], (err, res) => {
                    if (err) {
                        return callback(null, err);
                    } else {
                        return callback('User updated successfully', null);
                    }
                });
            };

            if (password) {
                bcrypt.hash(password, 10, (err, hashed) => {
                    if (err) {
                        return callback(null, err);
                    } else {
                        updateUser(hashed);
                    }
                });
            } else {
                updateUser(null);
            }
        }
    });
};


const viewProfileService = (token, callback) => {
    jwt.verify(token, 'unihubaammy', (err, decoded) => {
        if (err) {
            callback(err, null);
            return;
        }
        const userId = decoded.id;
        const query = 'SELECT firstName, lastName, email, address, bDate, userType FROM user WHERE userID = ?';
        db.query(query, [userId], (err, res) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, res);
            }
        });
    });
};
const forgetPasswordService = (userData, callback) => {
    const {email} = userData;
    const query = 'SELECT COUNT(*) AS count FROM user WHERE email = ?';
    db.query(query, [email], (err, res) => {
        if (err) {
            callback(err);
            return;
        }
        const count = res[0].count;
        if (count === 1) {
            const userEmail = email;
            const token = jwt.sign({userEmail}, 'unihubaammy', {expiresIn: '1h'});
            const otp = Math.ceil(10000 + Math.random() * 90000);
            let mailOptions = {
                from: 'unihub.gp@gmail.com',
                to: email,
                subject: 'OTP for Password reset',
                text: `Your OTP for resetting password is: ${otp}`
            };
            nodemailer.sendMail(mailOptions, (error, info) => {
                if (error) {
                    callback(error);
                } else {
                    callback(null, 'Reset Password OTP Email sent', otp, token);
                }
            });
        } else {
            callback('Email not found');
        }
    });
};
const checkOTPService = (neededData, callback) => {
    const {providedOTP, userEmail, sentOTP} = neededData;
    console.log(`Provided OTP: ${providedOTP}, Stored OTP: ${sentOTP}`);
    if (!sentOTP) {
        console.error(`No OTP sent for this user: ${userEmail}`);
        callback('No OTP sent for this user', null);
    } else if (providedOTP == sentOTP) {
        callback(null, 'verified');
    } else {
        console.error('OTP verification failed');
        callback('Verification failed', null);
    }
};
const changePasswordService = (userData, callback) => {

    const email = userData.userEmail;
    const password = userData.password;

    bcrypt.hash(password, 10, (err, hashed) => {
        if (err) {
            callback(err, null);
            return;
        }
        const query = 'UPDATE user SET password = ? WHERE email = ?';
        db.query(query, [hashed, email], (err, res) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, 'Password updated successfully');
            }
        });
    });

};

const returnUserType = (userId, callback) => {
    const query = 'select userType from user where userID = ?'
    db.query(query, [userId], (err, res) => {
        if (err) {
            callback(null, err)
        } else {
            callback(res, null)
        }
    })
}

const getUserDetailsService = (userId, callback) => {
    const query = 'SELECT firstName, lastName, email, userType, profilePhotoUrl FROM user WHERE userId = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            return callback({ message: 'Database query failed', details: err.message });
        }

        if (results.length === 0) {
            return callback({ message: 'User not found' });
        }

        callback(null, results[0]);
    });
};


module.exports = {
    signUpService,
    signInService,
    deleteUserService,
    editUserService,
    viewProfileService,
    forgetPasswordService,
    checkOTPService,
    changePasswordService,
    returnUserType,
    uploadUserPhotoService,
    getUserPhotoService,
    getUserDetailsService
};