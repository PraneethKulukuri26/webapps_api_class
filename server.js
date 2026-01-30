const express = require('express');
const cors = require('cors');
const ecommerceRoutes = require('./ecommerce/script');
const app = express();
const PORT = 3000;

// CORS configuration - Allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON
app.use(express.json());

// Serve static files from public folder
app.use('/public', express.static('public'));

// Sample data
let items = [
  { id: 1, name: 'Item 1', description: 'First item' },
  { id: 2, name: 'Item 2', description: 'Second item' },
  { id: 3, name: 'Item 3', description: 'Third item' }
];

// Sample users data
let users = [
  { id: 1, name: 'User NName1', age: 25, hasVoted: false },
  { id: 2, name: 'User Name2', age: 17, hasVoted: false },
  { id: 3, name: 'User Name3', age: 45, hasVoted: true }
];

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// GET - Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Basic API!' });
});

// GET - Get all items
app.get('/api/items', (req, res) => {
  res.json(items);
});

// GET - Get a single item by ID
app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  res.json(item);
});

// POST - Create a new item
app.post('/api/items', (req, res) => {
  const newItem = {
    id: items.length + 1,
    name: req.body.name,
    description: req.body.description
  };
  items.push(newItem);
  res.status(201).json(newItem);
});

// PUT - Update an item
app.put('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }
  item.name = req.body.name || item.name;
  item.description = req.body.description || item.description;
  res.json(item);
});

// DELETE - Delete an item
app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex(i => i.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: 'Item not found' });
  }
  items.splice(index, 1);
  res.json({ message: 'Item deleted successfully' });
});

// POST - Check if user can vote (by age)
app.post('/api/check-vote-eligibility', (req, res) => {
  const { age, dateOfBirth } = req.body;
  
  if (!age && !dateOfBirth) {
    return res.status(400).json({ 
      message: 'Please provide either age or dateOfBirth',
      canVote: false 
    });
  }
  
  let userAge = age;
  if (dateOfBirth) {
    userAge = calculateAge(dateOfBirth);
  }
  
  const canVote = userAge >= 18;
  
  res.json({
    canVote,
    age: userAge,
    message: canVote 
      ? 'You are eligible to vote!' 
      : `You must be 18 or older to vote. You need to wait ${18 - userAge} more year(s).`
  });
});

// GET - Check specific user's voting eligibility by ID
app.get('/api/users/:id/can-vote', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const canVote = user.age >= 18 && !user.hasVoted;
  
  res.json({
    userId: user.id,
    name: user.name,
    age: user.age,
    canVote,
    hasVoted: user.hasVoted,
    message: !canVote && user.hasVoted 
      ? 'User has already voted' 
      : canVote 
        ? 'User is eligible to vote' 
        : 'User is not old enough to vote'
  });
});


app.get('/api/check-vote-eligibility/:age', (req, res) => {
    const age = parseInt(req.params.age);
    if (isNaN(age)) {
        return res.status(400).json({ message: 'Invalid age parameter', canVote: false });
    }

    const canVote = age >= 18;
    res.json({
        canVote,
        age: age,
        message: canVote 
            ? 'You are eligible to vote!' 
            : `You must be 18 or older to vote. You need to wait ${18 - age} more year(s).`
    });
});

// GET - Get all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// POST - Add a new user
app.post('/api/users', (req, res) => {
  const newUser = {
    id: users.length + 1,
    name: req.body.name,
    age: req.body.age,
    hasVoted: false
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Use e-commerce routes
app.use('/api', ecommerceRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});