const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());
// MongoDB Configuration
mongoose.connect('mongodb+srv://root:Gokul@332003@mern.8xxkbvf.mongodb.net/milk_pro?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to the database');
});

// Schema and Model for users
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

app.post('/users', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user) {
      if (user.password === password) {
        res.status(200).json({ message: 'Login successful' });
      } else {
        res.status(401).json({ error: 'Invalid password' });
      }
    } else {
      res.status(401).json({ error: 'Invalid username' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

const saleSchema = new mongoose.Schema({
  buyer: String,
  quantity: Number,
  date: Date,
});

const Sale = mongoose.model('Sale', saleSchema);

app.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.find();
    res.json(sales);
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

app.post('/sales', async (req, res) => {
  try {
    const { buyer, quantity, date, milkType } = req.body;

    const existingSale = await Sale.findOne({ buyer, date });
    if (existingSale) {
      existingSale.quantity = quantity; // Update the quantity of the existing sale
      await existingSale.save();
    } else {
      const newSale = new Sale({ buyer, quantity, date, milkType });
      await newSale.save(); // Save the new sale document to the database
    }

    res.status(200).json({ message: 'Sale added successfully' });
  } catch (error) {
    console.error('Failed to add sale:', error);
    res.status(500).json({ error: 'Failed to add sale' });
  }
});

app.put('/sales/:buyer/:date', async (req, res) => {
  try {
    const { buyer, date } = req.params;
    const newQuantity = req.body.quantity;

    await Sale.updateOne({ buyer, date }, { quantity: newQuantity });

    res.status(200).json({ message: 'Quantity updated successfully' });
  } catch (error) {
    console.error('Failed to update quantity:', error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

app.delete('/sales/:buyer/:date', async (req, res) => {
  try {
    const { buyer, date } = req.params;

    await Sale.deleteOne({ buyer, date });

    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Failed to delete sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

app.delete('/sales/reset/:buyer/:date', async (req, res) => {
  try {
    const { buyer, date } = req.params;

    // Parse the date parameter as a Date object
    const resetDate = new Date(date);

    // Implement your logic to reset sales data for the given buyer and date here
    // Use the 'buyer' and 'resetDate' variables in your logic

    // Delete all sales data for the specified buyer and date
    await Sale.deleteMany({ buyer, date: resetDate });

    res.status(200).json({ message: 'Sales data reset successfully' });
  } catch (error) {
    console.error('Error resetting sales data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
