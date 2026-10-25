const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Message = require('./models/Message');

const connectDB = require('./config/db');

const users = [
  {
    name: 'Arjun Sharma',
    email: 'arjun@college.edu',
    password: 'password123',
    college: 'IIT Delhi',
    phone: '9876543210',
    location: 'Hostel 5, Room 302',
    role: 'user',
    status: 'active'
  },
  {
    name: 'Priya Patel',
    email: 'priya@college.edu',
    password: 'password123',
    college: 'IIT Delhi',
    phone: '9876543211',
    location: 'Hostel 3, Room 114',
    role: 'user',
    status: 'active'
  },
  {
    name: 'Rahul Kumar',
    email: 'rahul@college.edu',
    password: 'password123',
    college: 'IIT Delhi',
    phone: '9876543212',
    location: 'Hostel 8, Room 201',
    role: 'user',
    status: 'active'
  },
  {
    name: 'Sneha Gupta',
    email: 'sneha@college.edu',
    password: 'password123',
    college: 'DTU',
    phone: '9876543213',
    location: 'Girls Hostel 2, Room 405',
    role: 'user',
    status: 'active'
  },
  {
    name: 'Admin User',
    email: 'admin@localcommunity.com',
    password: 'admin123',
    college: 'IIT Delhi',
    phone: '9876543200',
    location: 'Admin Office',
    role: 'admin',
    status: 'active'
  }
];

const getProducts = (userIds) => [
  {
    title: 'Engineering Mathematics by B.S. Grewal',
    description: 'Higher Engineering Mathematics, 44th Edition. Lightly highlighted, all pages intact. Great for first and second year students. Covers calculus, linear algebra, differential equations, and more.',
    price: 350,
    category: 'Books',
    condition: 'Good',
    images: ['/uploads/placeholder-book1.jpg'],
    seller: userIds[0],
    location: 'Hostel 5, IIT Delhi',
    status: 'active',
    views: 45
  },
  {
    title: 'HP Pavilion Laptop - i5 12th Gen',
    description: '2023 model HP Pavilion, 16GB RAM, 512GB SSD, 15.6" FHD display. Used for 1 year. Battery health 92%. Comes with charger and laptop sleeve. Perfect for coding and light gaming.',
    price: 42000,
    category: 'Electronics',
    condition: 'Like New',
    images: ['/uploads/placeholder-laptop1.jpg'],
    seller: userIds[1],
    location: 'Hostel 3, IIT Delhi',
    status: 'active',
    views: 120
  },
  {
    title: 'Study Table with Bookshelf',
    description: 'Wooden study table with attached bookshelf. Dimensions: 4ft x 2ft. Sturdy build, minor scratches. Ideal for hostel room. Disassembly possible for easy transport.',
    price: 2500,
    category: 'Furniture',
    condition: 'Good',
    images: ['/uploads/placeholder-furniture1.jpg'],
    seller: userIds[2],
    location: 'Hostel 8, IIT Delhi',
    status: 'active',
    views: 38
  },
  {
    title: 'Firefox Hybrid Bicycle 21-Speed',
    description: 'Firefox Rapide 21-speed hybrid bicycle. Used for 6 months. Regular servicing done. Includes lock, pump, and bell. Great for campus commute.',
    price: 8500,
    category: 'Cycles',
    condition: 'Good',
    images: ['/uploads/placeholder-cycle1.jpg'],
    seller: userIds[0],
    location: 'Hostel 5 Parking, IIT Delhi',
    status: 'active',
    views: 67
  },
  {
    title: 'Casio Scientific Calculator fx-991EX',
    description: 'Casio fx-991EX ClassWiz scientific calculator. Barely used, works perfectly. Essential for engineering exams. Original box included.',
    price: 800,
    category: 'Stationery',
    condition: 'Like New',
    images: ['/uploads/placeholder-stationery1.jpg'],
    seller: userIds[3],
    location: 'Girls Hostel 2, DTU',
    status: 'active',
    views: 23
  },
  {
    title: 'Room Cooler - Symphony Diet 12T',
    description: 'Symphony Diet 12T personal cooler. 12L tank. Used for 2 summers. Cooling pads replaced recently. Great for small hostel rooms.',
    price: 3000,
    category: 'Hostel Essentials',
    condition: 'Fair',
    images: ['/uploads/placeholder-cooler1.jpg'],
    seller: userIds[2],
    location: 'Hostel 8, IIT Delhi',
    status: 'active',
    views: 55
  },
  {
    title: 'JBL Flip 5 Bluetooth Speaker',
    description: 'JBL Flip 5 portable waterproof speaker. Excellent bass, 12hr battery. Color: Black. No scratches. Selling because I got a newer model.',
    price: 5500,
    category: 'Electronics',
    condition: 'Like New',
    images: ['/uploads/placeholder-speaker1.jpg'],
    seller: userIds[1],
    location: 'Hostel 3, IIT Delhi',
    status: 'active',
    views: 89
  },
  {
    title: 'Formal Blazer - Navy Blue (Size M)',
    description: 'Navy blue formal blazer, size M. Worn twice for interviews. Brand: Peter England. In excellent condition. Dry cleaned.',
    price: 1200,
    category: 'Fashion',
    condition: 'Like New',
    images: ['/uploads/placeholder-fashion1.jpg'],
    seller: userIds[3],
    location: 'Girls Hostel 2, DTU',
    status: 'active',
    views: 31
  },
  {
    title: 'Introduction to Algorithms (CLRS)',
    description: 'Introduction to Algorithms by Cormen, Leiserson, Rivest, Stein. 3rd Edition. The bible of algorithms. Some highlighting in first few chapters.',
    price: 500,
    category: 'Books',
    condition: 'Good',
    images: ['/uploads/placeholder-book2.jpg'],
    seller: userIds[2],
    location: 'Hostel 8, IIT Delhi',
    status: 'active',
    views: 72
  },
  {
    title: 'Electric Kettle 1.5L',
    description: 'Prestige electric kettle, 1.5L capacity. Stainless steel body. Auto shut-off. Perfect for making tea/coffee and instant noodles in hostel.',
    price: 600,
    category: 'Hostel Essentials',
    condition: 'Good',
    images: ['/uploads/placeholder-kettle1.jpg'],
    seller: userIds[0],
    location: 'Hostel 5, IIT Delhi',
    status: 'active',
    views: 41
  },
  {
    title: 'Arduino Starter Kit',
    description: 'Complete Arduino Uno starter kit with breadboard, LEDs, resistors, sensors, wires, and project book. Used for one course project. Everything works.',
    price: 1500,
    category: 'Electronics',
    condition: 'Good',
    images: ['/uploads/placeholder-arduino1.jpg'],
    seller: userIds[1],
    location: 'Hostel 3, IIT Delhi',
    status: 'active',
    views: 56
  },
  {
    title: 'Bean Bag - XXL Red',
    description: 'XXL bean bag, red color, filled with premium beans. Very comfortable for gaming and reading. Too big for my new room.',
    price: 1800,
    category: 'Furniture',
    condition: 'Good',
    images: ['/uploads/placeholder-beanbag1.jpg'],
    seller: userIds[3],
    location: 'Girls Hostel 2, DTU',
    status: 'sold',
    views: 44
  }
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);
    console.log('');
    console.log('Login Credentials:');
    console.log('==================');
    users.forEach(u => {
      console.log(`  ${u.name} (${u.role}): ${u.email} / ${u.password}`);
    });
    console.log('');

    // Create products
    const userIds = createdUsers.filter(u => u.role === 'user').map(u => u._id);
    const productData = getProducts(userIds);
    const createdProducts = await Product.create(productData);
    console.log(`Created ${createdProducts.length} products`);

    // Create some sample messages
    const sampleMessages = [
      {
        sender: userIds[1],
        receiver: userIds[0],
        product: createdProducts[0]._id,
        message: 'Hi! Is the B.S. Grewal book still available?',
        read: true
      },
      {
        sender: userIds[0],
        receiver: userIds[1],
        product: createdProducts[0]._id,
        message: 'Yes, it is! Would you like to see it? I can meet at the library.',
        read: true
      },
      {
        sender: userIds[1],
        receiver: userIds[0],
        product: createdProducts[0]._id,
        message: 'That works! How about tomorrow at 4 PM?',
        read: false
      },
      {
        sender: userIds[2],
        receiver: userIds[1],
        product: createdProducts[1]._id,
        message: 'Can you do 38k for the laptop? I can pick it up today.',
        read: false
      }
    ];

    await Message.create(sampleMessages);
    console.log(`Created ${sampleMessages.length} sample messages`);

    // Add some favorites
    const user1 = await User.findById(userIds[0]);
    user1.favorites.push(createdProducts[1]._id, createdProducts[6]._id);
    await user1.save();

    const user2 = await User.findById(userIds[1]);
    user2.favorites.push(createdProducts[3]._id, createdProducts[8]._id);
    await user2.save();
    console.log('Added sample favorites');

    console.log('');
    console.log('✅ Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
