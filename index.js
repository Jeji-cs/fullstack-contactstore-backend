const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 4000;
const db = require("./config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtSecret = "Jeji";
const User = require("./models/user.model");
const Contact = require("./models/Contact");

app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend
    methods: "GET,POST,PUT,DELETE", // Allowed methods
    allowedHeaders: "Content-Type,Authorization", // Allowed headers
  })
);

db();
app.use(express.json());

const verify = async (req, res, next) => {
  let token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided or incorrect format" });
  }

  token = token.split(" ")[1]; // ✅ Extract actual token

  try {
    const data = jwt.verify(token, jwtSecret);
    const user = await User.findOne({ email: data.email });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    req.decoded = user; // ✅ Store user details in req.decoded
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};


// Add a new contact
app.post("/contacts", verify, async (req, res) => {
  try {
    console.log("Incoming request body:", req.body); // ✅ Debugging

    const { name, email, phone } = req.body;
    const userId = req.decoded._id; // ✅ Extract user ID from token

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user ID found" });
    }

    const newContact = new Contact({ name, email, phone, userId }); // ✅ Add userId
    await newContact.save();

    res
      .status(201)
      .json({ message: "Contact added successfully", contact: newContact });
  } catch (error) {
    console.error("Error saving contact:", error);
    res
      .status(500)
      .json({ message: "Failed to save contact", error: error.message });
  }
});



// Get all contacts for a user
app.get("/contacts", verify, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.decoded._id }); // ✅ Corrected
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Update a contact
app.put("/contacts/:id", verify, async (req, res) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedContact);
  } catch (err) {
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// Delete a contact
app.delete("/contacts/:id", verify, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.decoded._id; // ✅ Get logged-in user ID from token

    // Find the contact and ensure it belongs to the logged-in user
    const contact = await Contact.findOne({ _id: contactId, userId });

    if (!contact) {
      return res
        .status(404)
        .json({ message: "Contact not found or unauthorized" });
    }

    await Contact.findByIdAndDelete(contactId);
    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res
      .status(500)
      .json({ message: "Failed to delete contact", error: error.message });
  }
});

//Register a new User
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Login a User
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password) {
      return res
        .status(400)
        .send({ message: "Email and password are required" });
    }

    const result = await User.findOne({ email });
    if (!result) {
      return res.status(404).send({ message: "User Not Found" });
    }

    const isMatch = await bcrypt.compare(password, result.password);
    if (isMatch) {
      const token = jwt.sign({ email: result.email }, jwtSecret, {
        expiresIn: "1h",
      });
      return res.status(200).send({
        message: "User Logged In Successfully",
        token,
      });
    }
    return res.status(400).send({ message: "Invalid Password" });
  } catch (err) {
    res.status(500).send({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

// New endpoint to fetch user data
app.get("/user", verify, async (req, res) => {
  try {
    res.status(200).json({
      message: "User data fetched successfully",
      user: {
        username: req.decoded.username,
        email: req.decoded.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user data",
      error: error.message,
    });
  }
});


app.listen(port, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log("server running on port : ", port);
});
