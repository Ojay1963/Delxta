const MenuItem = require('../models/MenuItem')
const Review = require('../models/Review')

const imagePool = [
  'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=800&q=80',
]

const nigerianNames = [
  'Party Jollof Supreme',
  'Native Rice Delight',
  'Ayamase Bowl',
  'Ofada Special',
  'Efo Riro Combo',
  'Banga Fusion Plate',
  'Nkwobi Pot',
  'Asun Pepper Grill',
  'Catfish Pepper Soup',
  'Goat Meat Pepper Soup',
  'Seafood Okra Platter',
  'Egusi Heritage Bowl',
  'Ogbono Comfort Pot',
  'Afang Signature Plate',
  'Edikang Ikong Feast',
  'Fisherman Soup',
  'Isi Ewu Royale',
  'Suya Steak Platter',
  'Amala and Gbegiri Set',
  'Semo and Ewedu Set',
  'Pounded Yam and Oha',
  'Yam Porridge Coastal',
  'Beans and Plantain Plus',
  'Moi Moi Trio',
  'Akara Brunch Plate',
  'Abacha Classic',
  'Ukwa Gourmet Bowl',
  'Grilled Tilapia Naija',
  'Turkey Stew Rice',
  'Village Coconut Rice',
]

const intercontinentalNames = [
  'Ribeye Butter Steak',
  'Sirloin Pepper Steak',
  'Lemon Herb Chicken',
  'Creamy Mushroom Pasta',
  'Seafood Alfredo',
  'Grilled Salmon Plate',
  'Teriyaki Chicken Bowl',
  'Beef Stroganoff',
  'Chicken Cordon Bleu',
  'Roast Lamb Chop',
  'BBQ Pork Ribs',
  'Shrimp Linguine',
  'Margherita Flatbread',
  'Pepperoni Flatbread',
  'Truffle Mac and Cheese',
  'Chicken Caesar Plate',
  'Mediterranean Bowl',
  'Beef Burger Deluxe',
  'Crispy Chicken Burger',
  'Fish and Chips',
  'Tuna Nicoise Bowl',
  'Steak Frites',
  'Lobster Roll',
  'Chicken Parmesan',
  'Spinach Ravioli',
  'Risotto Milanese',
  'Turkey Club Stack',
  'Prawn and Rice Pilaf',
  'BBQ Chicken Pizza',
  'Four Cheese Pizza',
]

const starterNames = [
  'Spicy Wings Basket',
  'Crispy Calamari',
  'Garlic Bread Trio',
  'Tomato Bruschetta',
  'Chicken Spring Rolls',
  'Beef Samosa Duo',
  'Cheese Stuffed Peppers',
  'Onion Rings Tower',
  'Loaded Potato Skins',
  'Mini Meatballs',
  'Pepper Chicken Bites',
  'Plantain Chips and Dip',
  'Avocado Shrimp Cups',
  'Grilled Corn Ribs',
  'Smoked Fish Crostini',
  'Chicken Quesadilla',
  'Halloumi Fries',
  'Mozzarella Sticks',
  'Prawn Tempura',
  'Beef Sliders',
  'Chicken Sliders',
  'Nachos Supreme',
  'Spicy Edamame Bowl',
  'Mushroom Arancini',
  'Mini Tacos',
  'Crab Cakes',
  'Roasted Pepper Hummus',
  'Crispy Yam Sticks',
  'Gizzard Skewers',
  'Chef Starter Sampler',
]

const drinkNames = [
  'Signature Old Fashioned',
  'Smoked Whiskey Sour',
  'Classic Mojito',
  'Berry Mojito',
  'Mango Daiquiri',
  'Passion Martini',
  'Espresso Martini',
  'Negroni Special',
  'Classic Margarita',
  'Spicy Margarita',
  'Lemon Drop',
  'Mai Tai',
  'Pina Colada',
  'Dark and Stormy',
  'Paloma Fizz',
  'Aperol Spritz',
  'Red Wine Glass',
  'White Wine Glass',
  'Sparkling Rose',
  'House Sangria',
  'Iced Caramel Latte',
  'Vanilla Cold Brew',
  'Classic Cappuccino',
  'Hot Chocolate Deluxe',
  'Chapman Cooler',
  'Zobo Citrus Spritz',
  'Ginger Pineapple Punch',
  'Cucumber Mint Cooler',
  'Tropical Smoothie',
  'Virgin Sunrise',
]

const makeDescription = (category, name) =>
  `${name} prepared with premium ingredients and balanced flavors for our ${category.toLowerCase()} selection.`

const makePrice = (base, index, step) => {
  const value = base + index * step
  return `NGN ${value.toLocaleString()}`
}

const makeCategoryItems = (names, category, basePrice, step, isFeaturedEvery = 0) =>
  names.map((name, index) => ({
    name,
    description: makeDescription(category, name),
    price: makePrice(basePrice, index, step),
    category,
    image: imagePool[index % imagePool.length],
    isFeatured: isFeaturedEvery > 0 && index % isFeaturedEvery === 0,
  }))

const seedMenu = [
  ...makeCategoryItems(nigerianNames, 'Nigerian Delicacies', 5500, 400, 7),
  ...makeCategoryItems(intercontinentalNames, 'Intercontinental', 8500, 600, 9),
  ...makeCategoryItems(starterNames, 'Starters & Appetizers', 3000, 250, 8),
  ...makeCategoryItems(drinkNames, 'Signature Drinks', 2500, 300, 6),
]

const seedReviews = [
  {
    name: 'Adesola B.',
    role: 'Food Critic',
    quote:
      'Delxta offers an unparalleled dining experience. The Jollof Rice is simply the best in Lagos.',
    avatar:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80',
    rating: 5,
  },
  {
    name: 'James T.',
    role: 'Regular Customer',
    quote:
      'The ambiance is breathtaking and the service is top-notch. Highly recommended for date nights.',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    rating: 5,
  },
  {
    name: 'Sarah K.',
    role: 'Event Planner',
    quote:
      'We hosted our corporate dinner here and everything was perfect. The private dining room is exquisite.',
    avatar:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
    rating: 5,
  },
]

const topUpMenuCategory = async (category) => {
  const targetItems = seedMenu.filter((item) => item.category === category)
  const existing = await MenuItem.find({ category }).select('name -_id').lean()
  const existingNames = new Set(existing.map((item) => item.name))
  const missing = targetItems.filter((item) => !existingNames.has(item.name))

  if (missing.length > 0) {
    await MenuItem.insertMany(missing)
  }
}

const seedDatabase = async () => {
  const categories = [
    'Nigerian Delicacies',
    'Intercontinental',
    'Starters & Appetizers',
    'Signature Drinks',
  ]

  for (const category of categories) {
    await topUpMenuCategory(category)
  }

  const reviewCount = await Review.countDocuments()
  if (reviewCount === 0) {
    await Review.insertMany(seedReviews)
  }
}

module.exports = seedDatabase
