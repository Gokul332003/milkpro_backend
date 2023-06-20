const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
require("dotenv").config();

app.use(cors({
  origin: ["http://localhost:3000", "https://mern-task-app.onrender.com"]
}));
app.use(express.json());

// MongoDB Configuration
mongoose.connect('mongodb://127.0.0.1:27017/milk_pro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to the database');
});

// Schema and Model
const saleSchema = new mongoose.Schema({
  buyer: String,
  quantity: Number,
  date: Date,
  milkType: String,
});

const Sale = mongoose.model('Sale', saleSchema);

app.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.find();
    const salesData = sales.map((sale) => ({
      buyer: sale.buyer,
      quantity: sale.quantity,
      date: sale.date.toString(),
      milkType: sale.milkType,
    }));
    res.json(salesData);
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

app.listen(3001, () => {
  console.log('Server is listening on port 3001');
});
