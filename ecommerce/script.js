const express = require('express');
const router = express.Router();

// Helper function to get full image URL
const getFullImageUrl = (req, imagePath) => {
  return `${req.protocol}://${req.get('host')}${imagePath}`;
};

// Helper function to format product with full image URL
const formatProductWithFullUrl = (product, req) => {
  return {
    ...product,
    image: getFullImageUrl(req, product.image)
  };
};

// E-commerce Products Data
let products = [
  { 
    id: 1, 
    name: 'Wireless Headphones', 
    description: 'High-quality Bluetooth headphones with noise cancellation',
    price: 79.99,
    category: 'Electronics',
    stock: 50,
    image: '/public/images/wireless_headset.jpg'
  },
  { 
    id: 2, 
    name: 'Smart Watch', 
    description: 'Fitness tracker with heart rate monitor',
    price: 199.99,
    category: 'Electronics',
    stock: 30,
    image: '/public/images/smart_watch.jpg'
  },
  { 
    id: 3, 
    name: 'Running Shoes', 
    description: 'Comfortable sports shoes for running',
    price: 89.99,
    category: 'Sports',
    stock: 100,
    image: '/public/images/running_shoes.jpg'
  },
  { 
    id: 4, 
    name: 'Coffee Maker', 
    description: 'Automatic coffee machine with timer',
    price: 129.99,
    category: 'Home & Kitchen',
    stock: 20,
    image: '/public/images/Coffee_Maker.jpg'
  },
  { 
    id: 5, 
    name: 'Backpack', 
    description: 'Water-resistant laptop backpack',
    price: 49.99,
    category: 'Accessories',
    stock: 75,
    image: '/public/images/Backpack.jpg'
  },
  { 
    id: 6, 
    name: 'Yoga Mat', 
    description: 'Non-slip exercise mat',
    price: 29.99,
    category: 'Sports',
    stock: 150,
    image: '/public/images/Yoga_Mat.jpg'
  }
];

// Shopping Cart Data
let carts = [];

// Orders Data
let orders = [];

// GET - Get all products
router.get('/products', (req, res) => {
  const { category, minPrice, maxPrice, search } = req.query;
  
  let filteredProducts = [...products];
  
  // Filter by category
  if (category) {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  // Filter by price range
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }
  
  // Search by name or description
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Format products with full image URLs
  const productsWithFullUrls = filteredProducts.map(p => formatProductWithFullUrl(p, req));
  res.json(productsWithFullUrls);
});

// GET - Get a single product by ID
router.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(formatProductWithFullUrl(product, req));
});

// GET - Get all categories
router.get('/categories', (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  res.json(categories);
});

// POST - Add product to cart
router.post('/cart', (req, res) => {
  const { userId, productId, quantity } = req.body;
  
  if (!userId || !productId || !quantity) {
    return res.status(400).json({ message: 'userId, productId, and quantity are required' });
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  if (product.stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }
  
  let userCart = carts.find(c => c.userId === userId);
  if (!userCart) {
    userCart = { userId, items: [] };
    carts.push(userCart);
  }
  
  const existingItem = userCart.items.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    userCart.items.push({ productId, quantity, product });
  }
  
  res.status(201).json(userCart);
});

// GET - Get user's cart
router.get('/cart/:userId', (req, res) => {
  const userCart = carts.find(c => c.userId === parseInt(req.params.userId));
  if (!userCart) {
    return res.json({ userId: parseInt(req.params.userId), items: [], total: 0 });
  }
  
  const total = userCart.items.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );
  
  res.json({ ...userCart, total: total.toFixed(2) });
});

// DELETE - Remove item from cart
router.delete('/cart/:userId/:productId', (req, res) => {
  const userCart = carts.find(c => c.userId === parseInt(req.params.userId));
  if (!userCart) {
    return res.status(404).json({ message: 'Cart not found' });
  }
  
  userCart.items = userCart.items.filter(item => item.productId !== parseInt(req.params.productId));
  res.json({ message: 'Item removed from cart', cart: userCart });
});

// POST - Place an order
router.post('/orders', (req, res) => {
  const { userId, items, shippingAddress } = req.body;
  
  if (!userId || !items || items.length === 0) {
    return res.status(400).json({ message: 'userId and items are required' });
  }
  
  let total = 0;
  const orderItems = [];
  
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(404).json({ message: `Product ${item.productId} not found` });
    }
    
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
    }
    
    product.stock -= item.quantity;
    total += product.price * item.quantity;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity
    });
  }
  
  const order = {
    id: orders.length + 1,
    userId,
    items: orderItems,
    total: total.toFixed(2),
    shippingAddress,
    status: 'pending',
    orderDate: new Date().toISOString()
  };
  
  orders.push(order);
  
  // Clear user's cart
  const cartIndex = carts.findIndex(c => c.userId === userId);
  if (cartIndex !== -1) {
    carts.splice(cartIndex, 1);
  }
  
  res.status(201).json(order);
});

// GET - Get user's orders
router.get('/orders/:userId', (req, res) => {
  const userOrders = orders.filter(o => o.userId === parseInt(req.params.userId));
  res.json(userOrders);
});

module.exports = router;