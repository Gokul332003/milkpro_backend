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

const resetSchema = new mongoose.Schema({
  buyer: String,
  lastReset: Date,
});

const Reset = mongoose.model('Reset', resetSchema);

app.delete('/sales/:buyer/reset', async (req, res) => {
  try {
    const { buyer } = req.params;

    // Delete sales data for the buyer
    await Sale.deleteMany({ buyer });

    res.status(200).json({ message: `Sales data reset for ${buyer}.` });
  } catch (error) {
    console.error('Failed to reset sales data:', error);
    res.status(500).json({ error: 'Failed to reset sales data' });
  }
});
// ... (billing schema and endpoint for billing data)
const billingSchema = new mongoose.Schema({
  buyer: String,
  month: Number,
  year: Number,
  totalAmount: Number,
});

const Billing = mongoose.model('Billing', billingSchema);

app.get('/billing/:buyer/:year/:month', async (req, res) => {
  try {
    const { buyer, year, month } = req.params;
    const billingData = await Billing.findOne({ buyer, year, month });
    res.json(billingData || {});
  } catch (error) {
    console.error('Failed to fetch billing data:', error);
    res.status(500).json({ error: 'Failed to fetch billing data' });
  }
});

const calculateTotalAmountForMonth = (salesData) => {
  // Calculate the total amount based on the sales data for the month
  const pricePerLiter = 45; // Adjust as needed
  return salesData.reduce((total, sale) => total + sale.quantity * pricePerLiter, 0);
};

const monthlyReset = async () => {
  const currentDate = new Date();
  const lastResetDate = new Date(monthlyRecords.lastReset || 0);

  if (currentDate.getMonth() !== lastResetDate.getMonth()) {
    // Perform reset logic
    try {
      // Fetch sales data for the past month
      const salesForMonth = await Sale.find({
        date: {
          $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          $lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
        },
      });

      // Calculate the total amount for the month
      const totalAmount = calculateTotalAmountForMonth(salesForMonth);

      // Create or update billing record
      const billingData = await Billing.findOneAndUpdate(
        { buyer, year: currentDate.getFullYear(), month: currentDate.getMonth() },
        { buyer, year: currentDate.getFullYear(), month: currentDate.getMonth(), totalAmount },
        { upsert: true, new: true }
      );

      // Update the last reset date on the server
      await Reset.updateOne({ buyer }, { lastReset: new Date() }, { upsert: true });

      setMonthlyRecords({ lastReset: currentDate.getTime() });
      fetchSalesData(); // Fetch data again after the reset
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  }
};

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
