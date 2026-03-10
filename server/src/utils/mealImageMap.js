const path = require('path')

const mealImageMap = {
  'party jollof supreme': 'PARTY-JOLLOF.jpg',
  'classic jollof rice': 'CLASS-JOLLOF.jpg',
  'native rice delight': 'NATIVE RICE DELIGHT.jpg',
  'ayamase bowl': 'AYAMASE BOWL.jpg',
  'ofada special': 'OFADA SPECIAL.jpg',
  'efo riro combo': 'EFO RIRO COMBO.jpg',
  'banga fusion plate': 'BANGA FUSION PLATE.jpg',
  'asun pepper grill': 'Asun-Peppered-Goat-Meat.jpg',
  'catfish pepper soup': 'Catfish peppersoup.JPG',
  'goat meat pepper soup': 'PEPPER-SOUP(GOAT-MEAT).jpg',
  'seafood okra platter': 'seafood okra platter.jpg',
  'grilled tilapia naija': 'GRILLED CROAKER FISH.jpg',
  'pounded yam & egusi': 'POUNDED-YAM & EGUSI.jpg',
  'bbq chicken pizza': 'bbq_chicken_pizza.png',
  'bbq pork ribs': 'bbq_pork_ribs.png',
  'beef burger deluxe': 'beef_burger_deluxe.png',
  'beef stroganoff': 'beef_stroganoff.png',
  'chicken caesar plate': 'chicken_caesar_plate.png',
  'chicken cordon bleu': 'chicken_cordon_bleu.png',
  'chicken parmesan': 'chicken_parmesan.png',
  'creamy mushroom pasta': 'creamy_mushroom_pasta.png',
  'crispy chicken burger': 'crispy_chicken_burger.png',
  'fish and chips': 'fish_and_chips.png',
  'four cheese pizza': 'four_cheese_pizza_food_photography.png',
  'grilled salmon plate': 'grilled_salmon_plate.png',
  'lemon herb chicken': 'lemon_herb_chicken.png',
  'lobster roll': 'lobster_roll.png',
  'margherita flatbread': 'margherita_flatbread.png',
  'mediterranean bowl': 'mediterranean_bowl.png',
  'pepperoni flatbread': 'pepperoni_flatbread.png',
  'prawn and rice pilaf': 'prawn_and_rice_pilaf.png',
  'ribeye butter steak': 'ribeye_butter_steak.png',
  'ribeye steak': 'ribeye_steak.png',
  'risotto milanese': 'risotto_milanese.png',
  'roast lamb chop': 'roast_lamb_chop.png',
  'seafood alfredo': 'seafood_alfredo (1).png',
  'shrimp linguine': 'shrimp_linguine.png',
  'sirloin pepper steak': 'sirloin_pepper_steak.png',
  'spinach ravioli': 'spinach_ravioli.png',
  'teriyaki chicken bowl': 'teriyaki_chicken_bowl.png',
  'truffle mac and cheese': 'truffle_mac_and_cheese.png',
  'tuna nicoise bowl': 'tuna_nicoise_bowl.png',
  'turkey club stack': 'turkey_club_stack.png',
}

const normalizeMealName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const getMealImagePath = (mealName) => {
  const normalizedName = normalizeMealName(mealName)
  const mappedFile = mealImageMap[normalizedName]
  return mappedFile ? `/meal-images/${encodeURIComponent(mappedFile)}` : null
}

const withAbsoluteAssetUrl = (assetPath, req) => {
  if (!assetPath || !req) return assetPath
  if (/^https?:\/\//i.test(assetPath)) return assetPath
  return `${req.protocol}://${req.get('host')}${assetPath}`
}

const resolveMealImage = (mealName, fallbackImage, req) => {
  const matchedPath = getMealImagePath(mealName)
  if (matchedPath) return withAbsoluteAssetUrl(matchedPath, req)

  if (fallbackImage && fallbackImage.startsWith('/')) {
    return withAbsoluteAssetUrl(fallbackImage, req)
  }

  return fallbackImage
}

const getMealImageFilePath = (...parts) => path.join(__dirname, '..', 'meal-images', ...parts)

module.exports = {
  getMealImageFilePath,
  getMealImagePath,
  resolveMealImage,
}
