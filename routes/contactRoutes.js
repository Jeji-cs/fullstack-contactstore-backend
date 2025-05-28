const express = require("express");
const Contact = require("../models/Contact");
const jwt = require("jsonwebtoken");
const jwtSecret = "Jeji";
const User = require("../models/user.model");


const router = express.Router();

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization;
  jwt.verify(token, jwtSecret, async (err, data) => {
    if (err) return res.status(404).send({ message: "Unaurhorized User" });
    const result = await User.findOne({ email: data.email });
    if (!result) return res.status(404).send({ message: "User Not Found" });
    req.decoded = result;
    next();
  });
};


// Add a new contact
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const newContact = new Contact({ name, email, phone, userId: req.user.id });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// Get all contacts for a user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user.id });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// Update a contact
router.put("/:id", authMiddleware, async (req, res) => {
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
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Contact deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

module.exports = router;
