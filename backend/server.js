require('dotenv').config();
const Razorpay = require('razorpay');
express = require("express");
let app = express();
const path = require("path");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require("cors");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ─── Import Node's built-in HTTP module and the Socket.io Server class ───
const http = require('http');
const { Server } = require('socket.io');

let port = process.env.PORT;

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],     // Allow both possible React ports
    credentials: true,                    // important for sessions/cookies
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.urlencoded({ extended: true }));  // for form data
app.use(express.json());  // for JSON data

app.use(
    session({
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,       // false for HTTP on localhost
            sameSite: 'lax',    // allows cookie to be sent on cross-port fetch with credentials:include
            httpOnly: true,     // prevents JS from reading the cookie (security best practice)
            maxAge: 1000 * 60 * 60 * 24  // 24-hour session lifetime
        }
    })
);

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "RESUME_PROJECT1",
    password: process.env.DATABASE_PASSWORD
});

connection.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }
    console.log("Database connected successfully");

    // Ensure Messages table exists
    const createMessagesTable = `
        CREATE TABLE IF NOT EXISTS Messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            senderEmail VARCHAR(255) NOT NULL,
            receiverEmail VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    connection.query(createMessagesTable, (err) => {
        if (err) console.error("Failed to create Messages table:", err);
        else console.log("Messages table verified.");
    });

    // Ensure Payments table exists
    const createPaymentsTable = `
        CREATE TABLE IF NOT EXISTS Payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            orderId VARCHAR(255) UNIQUE NOT NULL,
            paymentId VARCHAR(255) DEFAULT NULL,
            userEmail VARCHAR(255) NOT NULL,
            providerEmail VARCHAR(255) NOT NULL,
            serviceType VARCHAR(100) NOT NULL,
            amount INT NOT NULL,
            currency VARCHAR(10) DEFAULT 'INR',
            status VARCHAR(50) DEFAULT 'created',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    connection.query(createPaymentsTable, (err) => {
        if (err) console.error("Failed to create Payments table:", err);
        else console.log("Payments table verified.");
    });
});

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_API,
    key_secret: process.env.RAZOR_SECRET
});

function generate_otp() {
    const otpNumber = crypto.randomInt(1000, 10000);
    return otpNumber.toString();
}

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_KEY
    }
});

async function send_email(targetEmail, generatedOtp) {
    try {
        const mailOptions = {
            from: `"ProFix Team" <${process.env.FROM_EMAIL}>`,
            to: targetEmail,
            subject: 'ProFix Account Verification',
            text: `Your 4-digit OTP to reset your password is: ${generatedOtp}. This code expires in 10 minutes.`
        };
        const info = await transporter.sendMail(mailOptions);
        return true;
    }
    catch (error) {
        console.error("Email delivery failed:", error);
        return false;
    }
}


app.post('/signup', async (req, res) => {
    const formData = req.body;
    if (!formData.UserName || !formData.Email || !formData.Password || !formData.phoneNumber || !formData.userType) {
        return res.status(400).json({ message: "All fields are required." });
    }
    const hashed_password = await bcrypt.hash(formData.Password, 10);
    if (formData.userType === 'Service Provider') {
        if (!formData.serviceType || !formData.Experience || !formData.City) {
            return res.status(400).json({ message: "All fields are required." });
        }
        try {
            const [existingUsers] = await connection.promise().query(
                "SELECT Email FROM Service_Provider_data WHERE Email = ?", [formData.Email]
            );
            if (existingUsers.length > 0) {
                return res.status(409).json({ message: "User with this email already exists." });
            }
            const insert_query = `INSERT INTO Service_Provider_data (UserName,Email,Password,phoneNumber,serviceType,Experience,City) VALUES (?,?,?,?,?,?,?)`;
            await connection.promise().query(insert_query, [formData.UserName, formData.Email, hashed_password, formData.phoneNumber, formData.serviceType, formData.Experience, formData.City]);
            return res.status(201).json({});
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    else {
        if (!formData.Address) {
            return res.status(400).json({ message: "All fields are required." });
        }
        try {
            const [existingUsers] = await connection.promise().query(
                "SELECT Email FROM User_data WHERE Email = ?", [formData.Email]
            );
            if (existingUsers.length > 0) {
                return res.status(409).json({ message: "User with this email already exists." });
            }
            const insert_query = `INSERT INTO User_data (UserName,Email,Password,phoneNumber,Address) VALUES (?,?,?,?,?)`;
            await connection.promise().query(insert_query, [formData.UserName, formData.Email, hashed_password, formData.phoneNumber, formData.Address]);
            return res.status(201).json({});
        }
        catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
});

app.post('/login', async (req, res) => {
    const formData = req.body;
    if (!formData.userType || !formData.Email || !formData.Password) {
        return res.status(400).json({ message: "All fields are required." });
    }
    const tableName = formData.userType === 'Service Provider' ? 'Service_Provider_data' : 'User_data';
    try {
        const [rows] = await connection.promise().query(
            `SELECT UserName, Email, Password FROM ${tableName} WHERE Email = ?`,
            [formData.Email]
        );
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        const userRecord = rows[0];
        const isMatch = await bcrypt.compare(formData.Password, userRecord.Password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        req.session.user = {
            email: userRecord.Email,
            userName: userRecord.UserName,
            role: formData.userType
        };
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ message: "Internal server error" });
            }
            return res.status(200).json({});
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// ─── NEW: Session check endpoint for frontend route guards ────────────────────
// Returns 200 + role if logged in, 401 if not
app.get('/session-check', (req, res) => {
    if (req.session && req.session.user && req.session.user.email) {
        return res.status(200).json({
            loggedIn: true,
            role: req.session.user.role,
            userName: req.session.user.userName,
            email: req.session.user.email
        });
    }
    return res.status(401).json({ loggedIn: false });
});

app.post('/verifyemail', async (req, res) => {
    const { Email } = req.body;
    if (!Email) {
        return res.status(400).json({ message: "Please enter your Email." });
    }
    try {
        let foundEmail = null;
        let userRole = null;
        const [userRows] = await connection.promise().query(
            "SELECT Email FROM User_data WHERE Email = ?",
            [Email]
        );

        if (userRows.length > 0) {
            foundEmail = userRows[0].Email;
            userRole = 'User';
        } else {
            const [providerRows] = await connection.promise().query(
                "SELECT Email FROM Service_Provider_data WHERE Email = ?",
                [Email]
            );
            if (providerRows.length > 0) {
                foundEmail = providerRows[0].Email;
                userRole = 'Service Provider';
            }
        }
        if (!foundEmail) {
            return res.status(404).json({ message: "No account found with this email." });
        }
        const generatedOtp = generate_otp();
        req.session.resetOtp = generatedOtp;
        req.session.resetEmail = Email;
        req.session.resetRole = userRole;
        // ─── FIX #13: Store OTP expiry timestamp (10 minutes from now) ───
        req.session.otpExpiry = Date.now() + 10 * 60 * 1000;
        req.session.isOtpVerified = false; // Add flag to require OTP verification

        const emailSent = await send_email(Email, generatedOtp);
        if (emailSent) {
            return res.status(200).json({ message: "OTP sent successfully to your email." });
        } else {
            return res.status(500).json({ message: "Failed to send email. Please try again." });
        }

    } catch (error) {
        console.error("Verify Email Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

app.post('/resend-otp', async (req, res) => {
    try {
        const newOtp = generate_otp();
        req.session.resetOtp = newOtp;
        // ─── FIX #13: Reset expiry on resend ───
        req.session.otpExpiry = Date.now() + 10 * 60 * 1000;
        req.session.isOtpVerified = false;
        const emailSent = await send_email(req.session.resetEmail, newOtp);
        if (emailSent) {
            return res.status(200).json({ message: "A new OTP has been sent." });
        } else {
            return res.status(500).json({ message: "Failed to send the new email." });
        }
    } catch (error) {
        console.error("Resend OTP Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

app.post('/otp', (req, res) => {
    const { otp } = req.body;
    if (!otp) {
        return res.status(400).json({ message: "Please enter your otp" });
    }
    // ─── FIX #13: Check OTP expiry before validating ───
    if (!req.session.otpExpiry || Date.now() > req.session.otpExpiry) {
        return res.status(401).json({ message: "OTP has expired. Please request a new one." });
    }
    if (otp === req.session.resetOtp) {
        req.session.isOtpVerified = true;
        return res.status(201).json({});
    } else {
        return res.status(401).json({ message: "Incorrect OTP , please enter correct OTP" });
    }
});


app.put('/newpassword', async (req, res) => {
    const { Password } = req.body;
    if (!Password) {
        return res.status(400).json({ message: "Please enter your new Password." });
    }

    try {
        const userRole = req.session.resetRole;
        const targetEmail = req.session.resetEmail;
        const isOtpVerified = req.session.isOtpVerified;

        if (!userRole || !targetEmail || !isOtpVerified) {
            return res.status(401).json({ message: "Session expired or OTP not verified. Please request a new OTP." });
        }

        let table_name = '';
        if (userRole === 'Service Provider') {
            table_name = 'Service_Provider_data';
        } else {
            table_name = 'User_data';
        }
        const hashed_password = await bcrypt.hash(Password, 10);
        const update_query = `UPDATE ${table_name} SET Password = ? WHERE Email = ?`;
        const [result] = await connection.promise().query(update_query, [hashed_password, targetEmail]);
        if (result.affectedRows > 0) {
            req.session.resetOtp = null;
            req.session.resetEmail = null;
            req.session.resetRole = null;
            req.session.otpExpiry = null;
            req.session.isOtpVerified = false;
            return res.status(201).json({ message: "Password updated successfully" });
        } else {
            return res.status(500).json({ message: "Failed to update password." });
        }

    } catch (error) {
        console.error("New Password Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

app.get('/user_profile', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const select_query = `SELECT UserName, Email, phoneNumber, Address 
                              FROM User_data 
                              WHERE Email = ?`;

        const [rows] = await connection.promise().query(select_query, [req.session.user.email]);

        if (rows.length > 0) {
            const userRow = rows[0];
            const profileData = {
                name: userRow.UserName,
                email: userRow.Email,
                phone: userRow.phoneNumber,
                address: userRow.Address
            };
            return res.status(200).json(profileData);

        } else {
            return res.status(404).json({ message: "User profile not found." });
        }
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

app.put('/userprofile_update', async (req, res) => {
    const formData = req.body;
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
        return res.status(400).json({ message: "Please enter your updated details" });
    }
    try {
        const update_query = `UPDATE User_data  
                                SET UserName = ? ,
                                Email = ?,
                                phoneNumber = ?,
                                Address = ?
                                WHERE Email = ?`;
        const [result] = await connection.promise().query(update_query, [formData.name, formData.email, formData.phone, formData.address, req.session.user.email]);
        if (result.affectedRows > 0) {
            req.session.user.email = formData.email;
            return res.status(200).json({ message: "Profile updated successfully" });
        } else {
            return res.status(404).json({ message: "User profile not found." });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

app.get('/User_dashboard', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const select_query = `SELECT UserName FROM User_data WHERE Email = ?`;
        const [rows] = await connection.promise().query(select_query, [req.session.user.email]);

        if (rows.length > 0) {
            const userName = rows[0].UserName;
            return res.status(200).json({ userName: userName });
        } else {
            return res.status(404).json({ message: "User profile not found." });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// ─── NEW FIX #4: Provider profile endpoint ────────────────────────────────────
app.get('/provider_profile', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const [rows] = await connection.promise().query(
            `SELECT UserName, Email, phoneNumber, serviceType, Experience, City FROM Service_Provider_data WHERE Email = ?`,
            [req.session.user.email]
        );
        if (rows.length > 0) {
            return res.status(200).json(rows[0]);
        }
        return res.status(404).json({ message: "Provider profile not found." });
    } catch (error) {
        console.error("Provider profile error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// ─── NEW FIX #3: Save a booking to the database ──────────────────────────────
// The bookings table must exist: CREATE TABLE Bookings (id INT AUTO_INCREMENT PRIMARY KEY,
// userEmail VARCHAR(255), providerEmail VARCHAR(255), serviceType VARCHAR(100),
// bookingDate DATE, timeSlot VARCHAR(20), description TEXT,
// status VARCHAR(50) DEFAULT 'Pending', createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
app.post('/booking', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const { providerEmail, serviceType, bookingDate, timeSlot, description } = req.body;
        if (!providerEmail || !serviceType || !bookingDate || !timeSlot || !description) {
            return res.status(400).json({ message: "All booking fields are required." });
        }
        const userEmail = req.session.user.email;
        const insert_query = `INSERT INTO Bookings (userEmail, providerEmail, serviceType, bookingDate, timeSlot, description, status)
                              VALUES (?, ?, ?, ?, ?, ?, 'Pending')`;
        const [result] = await connection.promise().query(insert_query, [
            userEmail, providerEmail, serviceType, bookingDate, timeSlot, description
        ]);
        return res.status(201).json({
            message: "Booking confirmed successfully!",
            bookingId: result.insertId
        });
    } catch (error) {
        console.error("Booking error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// ─── NEW FIX #11: Get all bookings for the logged-in user ─────────────────────
app.get('/my_bookings', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const userEmail = req.session.user.email;
        const [rows] = await connection.promise().query(
            `SELECT b.*, sp.UserName as providerName 
             FROM Bookings b
             LEFT JOIN Service_Provider_data sp ON b.providerEmail = sp.Email
             WHERE b.userEmail = ?
             ORDER BY b.createdAt DESC`,
            [userEmail]
        );
        return res.status(200).json({ bookings: rows });
    } catch (error) {
        console.error("My bookings error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// ─── NEW FIX #4: Get incoming bookings for the logged-in provider ──────────────
app.get('/provider_bookings', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const providerEmail = req.session.user.email;
        const [rows] = await connection.promise().query(
            `SELECT b.*, u.UserName as clientName, u.phoneNumber as clientPhone
             FROM Bookings b
             LEFT JOIN User_data u ON b.userEmail = u.Email
             WHERE b.providerEmail = ?
             ORDER BY b.createdAt DESC`,
            [providerEmail]
        );
        return res.status(200).json({ bookings: rows });
    } catch (error) {
        console.error("Provider bookings error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// ─── NEW FIX #3: Update booking status (accept/decline by provider) ───────────
app.put('/booking_status', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const { bookingId, status } = req.body;
        if (!bookingId || !status) {
            return res.status(400).json({ message: "bookingId and status are required." });
        }
        const [result] = await connection.promise().query(
            `UPDATE Bookings SET status = ? WHERE id = ? AND providerEmail = ?`,
            [status, bookingId, req.session.user.email]
        );
        if (result.affectedRows > 0) {
            return res.status(200).json({ message: `Booking ${status} successfully.` });
        }
        return res.status(404).json({ message: "Booking not found." });
    } catch (error) {
        console.error("Booking status error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// ─── NEW FIX #14: Get unavailable time slots for a provider on a specific date ─
app.get('/available_slots', async (req, res) => {
    try {
        const { providerEmail, date } = req.query;
        if (!providerEmail || !date) {
            return res.status(400).json({ message: "providerEmail and date are required." });
        }
        const [rows] = await connection.promise().query(
            `SELECT timeSlot FROM Bookings 
             WHERE providerEmail = ? AND bookingDate = ? AND status != 'Declined'`,
            [providerEmail, date]
        );
        const unavailableSlots = rows.map(r => r.timeSlot);
        return res.status(200).json({ unavailableSlots });
    } catch (error) {
        console.error("Available slots error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

app.get('/Service_Plumbing', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const get_query = 'SELECT * FROM Service_Provider_data WHERE serviceType = ?';
        const [rows] = await connection.promise().query(get_query, ['Plumbing']);
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Database error while fetching plumbing services:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the service providers."
        });
    }
});

app.get('/Service_Electrician', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const get_query = 'SELECT * FROM Service_Provider_data WHERE serviceType = ?';
        const [rows] = await connection.promise().query(get_query, ['Electrician']);
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Database error while fetching electrician services:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the service providers."
        });
    }
});

app.get('/Service_Carpentry', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const get_query = 'SELECT * FROM Service_Provider_data WHERE serviceType = ?';
        const [rows] = await connection.promise().query(get_query, ['Carpentry']);
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Database error while fetching carpentry services:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the service providers."
        });
    }
});

app.get('/Service_HouseKeeping', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const get_query = 'SELECT * FROM Service_Provider_data WHERE serviceType = ?';
        const [rows] = await connection.promise().query(get_query, ['HouseKeeping']);
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Database error while fetching housekeeping services:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the service providers."
        });
    }
});

// ─── REST endpoint to load past chat messages between two users ───────────────
app.get('/chat_history', async (req, res) => {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
        return res.status(400).json({ message: "Both user emails are required." });
    }
    try {
        const get_messages = `
            SELECT * FROM Messages 
            WHERE (senderEmail = ? AND receiverEmail = ?) 
               OR (senderEmail = ? AND receiverEmail = ?) 
            ORDER BY timestamp ASC`;
        const [rows] = await connection.promise().query(get_messages, [user1, user2, user2, user1]);
        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return res.status(500).json({ message: "Server error while fetching messages." });
    }
});

// ─── REST endpoint to load all active chats for the logged-in user ────────────
app.get('/my_chats', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        const myEmail = req.session.user.email;

        // Fetch all messages involving this user
        const [rows] = await connection.promise().query(
            `SELECT * FROM Messages 
             WHERE senderEmail = ? OR receiverEmail = ?
             ORDER BY timestamp DESC`,
            [myEmail, myEmail]
        );

        const chatsMap = new Map();
        for (const row of rows) {
            const otherEmail = row.senderEmail === myEmail ? row.receiverEmail : row.senderEmail;
            if (!chatsMap.has(otherEmail)) {
                chatsMap.set(otherEmail, row);
            }
        }

        const recentChats = Array.from(chatsMap.values());
        const chatList = [];

        for (const chat of recentChats) {
            const otherEmail = chat.senderEmail === myEmail ? chat.receiverEmail : chat.senderEmail;

            // Try to find the user in User_data
            let [userRows] = await connection.promise().query('SELECT UserName FROM User_data WHERE Email = ?', [otherEmail]);
            let name = "Unknown User";
            let role = "User";
            let city = "";
            let serviceType = "";
            let experience = "";

            if (userRows.length > 0) {
                name = userRows[0].UserName;
            } else {
                // Try Service_Provider_data
                let [provRows] = await connection.promise().query('SELECT UserName, City, serviceType, Experience FROM Service_Provider_data WHERE Email = ?', [otherEmail]);
                if (provRows.length > 0) {
                    name = provRows[0].UserName;
                    role = "Service Provider";
                    city = provRows[0].City;
                    serviceType = provRows[0].serviceType;
                    experience = provRows[0].Experience;
                }
            }

            chatList.push({
                otherEmail,
                name,
                role,
                city,
                serviceType,
                experience,
                lastMessage: chat.message,
                timestamp: chat.timestamp
            });
        }

        return res.status(200).json({ chats: chatList });
    } catch (error) {
        console.error("Error fetching chats list:", error);
        return res.status(500).json({ message: "Server error while fetching chats." });
    }
});

// ─── PAYMENT ENDPOINTS ─────────────────────────────────────────────────────────

// POST /payment/create-order — Creates a Razorpay order and stores it in the DB
app.post('/payment/create-order', async (req, res) => {
    try {
        // 1. Session guard
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const { amount, providerEmail, serviceType } = req.body;

        // 2. Validate required fields
        if (!amount || !providerEmail || !serviceType) {
            return res.status(400).json({ message: "amount, providerEmail, and serviceType are required." });
        }

        // 3. Validate amount is a positive integer and within sane bounds (max ₹10,00,000)
        const amountInPaise = Math.round(Number(amount));
        if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number." });
        }
        if (amountInPaise > 10000000) { // ₹10,00,000 in paise
            return res.status(400).json({ message: "Amount exceeds maximum allowed limit." });
        }

        const userEmail = req.session.user.email;

        // 4. Prevent paying yourself
        if (userEmail === providerEmail) {
            return res.status(400).json({ message: "You cannot make a payment to yourself." });
        }

        // 5. Check if there's already a paid order for this user-provider pair (prevent double-pay)
        const [existingPaid] = await connection.promise().query(
            `SELECT id FROM Payments WHERE userEmail = ? AND providerEmail = ? AND status = 'paid' ORDER BY createdAt DESC LIMIT 1`,
            [userEmail, providerEmail]
        );
        if (existingPaid.length > 0) {
            return res.status(409).json({ message: "A payment has already been completed for this service. You cannot pay again." });
        }

        // 6. Create Razorpay order
        const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receipt,
            notes: {
                userEmail: userEmail,
                providerEmail: providerEmail,
                serviceType: serviceType
            }
        });

        // 7. Store the order in our database
        await connection.promise().query(
            `INSERT INTO Payments (orderId, userEmail, providerEmail, serviceType, amount, currency, status)
             VALUES (?, ?, ?, ?, ?, ?, 'created')`,
            [order.id, userEmail, providerEmail, serviceType, amountInPaise, 'INR']
        );

        // 8. Return order details to frontend (only public key, never the secret)
        return res.status(201).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZOR_API
        });

    } catch (error) {
        console.error("Payment create-order error:", error);
        return res.status(500).json({ message: "Failed to create payment order. Please try again." });
    }
});

// POST /payment/verify — Verifies Razorpay payment signature (HMAC-SHA256)
app.post('/payment/verify', async (req, res) => {
    try {
        // 1. Session guard
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // 2. Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment verification data." });
        }

        // 3. Verify the order exists in our database and belongs to this user
        const [orderRows] = await connection.promise().query(
            `SELECT * FROM Payments WHERE orderId = ? AND userEmail = ?`,
            [razorpay_order_id, req.session.user.email]
        );
        if (orderRows.length === 0) {
            return res.status(404).json({ message: "Payment order not found." });
        }

        const paymentRecord = orderRows[0];

        // 4. Double-pay guard: reject if already paid
        if (paymentRecord.status === 'paid') {
            return res.status(409).json({ message: "This payment has already been verified." });
        }

        // 5. Compute HMAC-SHA256 signature and compare using timing-safe method
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZOR_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        // Timing-safe comparison to prevent timing attacks
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const receivedBuffer = Buffer.from(razorpay_signature, 'hex');

        let isValid = false;
        if (expectedBuffer.length === receivedBuffer.length) {
            isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
        }

        if (!isValid) {
            // Mark as failed in the database
            await connection.promise().query(
                `UPDATE Payments SET status = 'failed' WHERE orderId = ?`,
                [razorpay_order_id]
            );
            return res.status(400).json({ message: "Payment verification failed. Signature mismatch." });
        }

        // 6. Signature is valid — mark payment as paid
        await connection.promise().query(
            `UPDATE Payments SET status = 'paid', paymentId = ? WHERE orderId = ?`,
            [razorpay_payment_id, razorpay_order_id]
        );

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully.",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        return res.status(500).json({ message: "Payment verification failed. Please contact support." });
    }
});

// GET /payment/status/:orderId — Check payment status for a given order
app.get('/payment/status/:orderId', async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.email) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ message: "orderId is required." });
        }

        const [rows] = await connection.promise().query(
            `SELECT orderId, paymentId, amount, currency, status, createdAt
             FROM Payments WHERE orderId = ? AND userEmail = ?`,
            [orderId, req.session.user.email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Payment record not found." });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Payment status error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destruction error:", err);
                return res.status(500).json({ message: "Failed to log out." });
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: "Logged out successfully." });
        });
    } else {
        return res.status(200).json({ message: "No active session." });
    }
});

// ─── Wrap Express app in a native HTTP server ─────────────────────────────────
const server = http.createServer(app);

// ─── Attach Socket.io to the HTTP server ──────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ─── FIX #7: Track which emails are currently connected via socket ─────────────
// Maps socketId → email so we can look up who disconnected
const onlineUsers = new Map();

// ─── Socket.io connection handler ─────────────────────────────────────────────
io.on("connection", (socket) => {
    console.log(`A user connected via WebSocket: ${socket.id}`);

    // Event: "register_user"
    // Frontend emits this right after connecting, passing the logged-in user's email.
    // We store the mapping so we can emit status changes when they disconnect.
    socket.on("register_user", (email) => {
        onlineUsers.set(socket.id, email);
        // Tell everyone in rooms that share this user that they are now online
        socket.broadcast.emit("user_online", { email });
        console.log(`Registered online: ${email}`);
    });

    // Event: "join_room"
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    // Event: "send_message"
    socket.on("send_message", async (data) => {
        try {
            const insert_query = `
                INSERT INTO Messages (senderEmail, receiverEmail, message) 
                VALUES (?, ?, ?)`;
            await connection.promise().query(insert_query, [
                data.senderEmail,
                data.receiverEmail,
                data.message
            ]);
            socket.to(data.room).emit("receive_message", data);
        } catch (error) {
            console.error("Failed to save or broadcast message:", error);
        }
    });

    // Event: "disconnect"
    socket.on("disconnect", () => {
        const email = onlineUsers.get(socket.id);
        if (email) {
            onlineUsers.delete(socket.id);
            // Tell everyone that this user is now offline
            socket.broadcast.emit("user_offline", { email });
            console.log(`User disconnected (offline): ${email}`);
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});

// ─── Start the server ──────────────────────────────────────────────────────────
server.listen(port, () => {
    console.log("Server running on port ", port);
});