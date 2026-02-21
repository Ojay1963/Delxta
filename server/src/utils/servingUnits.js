const DRINK_CATEGORY = 'Signature Drinks'

const commonRules = [
  {
    test: /(pizza|flatbread)/i,
    options: [
      { value: 'pizza_8in', label: '8-inch', multiplier: 1 },
      { value: 'pizza_12in', label: '12-inch', multiplier: 1.8 },
      { value: 'pizza_16in', label: '16-inch', multiplier: 2.8 },
    ],
  },
  {
    test: /(soup|egusi|ogbono|afang|edikang|fisherman|pepper soup|efo riro|oha|gbegiri|ewedu)/i,
    options: [
      { value: 'bowl_500ml', label: 'Bowl (500 ml)', multiplier: 1 },
      { value: 'pot_1l', label: 'Pot (1 L)', multiplier: 1.9 },
      { value: 'pot_2l', label: 'Pot (2 L)', multiplier: 3.6 },
    ],
  },
  {
    test: /(wings|rings|sticks|bites|fries|chips|skewers|sliders|tempura|nachos|samosa|spring rolls|arancini|mozzarella)/i,
    options: [
      { value: 'portion_6pcs', label: '6 pcs', multiplier: 1 },
      { value: 'portion_12pcs', label: '12 pcs', multiplier: 1.85 },
      { value: 'portion_24pcs', label: '24 pcs', multiplier: 3.4 },
    ],
  },
  {
    test: /(burger|club|sandwich|roll|quesadilla|tacos)/i,
    options: [
      { value: 'single', label: 'Single', multiplier: 1 },
      { value: 'meal_combo', label: 'Meal Combo', multiplier: 1.35 },
      { value: 'double', label: 'Double', multiplier: 1.8 },
    ],
  },
  {
    test: /(steak|salmon|tilapia|lamb|ribs|chop|fish and chips|parmesan|stroganoff|cordon bleu)/i,
    options: [
      { value: 'portion_250g', label: '250 g', multiplier: 1 },
      { value: 'portion_400g', label: '400 g', multiplier: 1.55 },
      { value: 'platter_700g', label: 'Platter (700 g)', multiplier: 2.4 },
    ],
  },
]

const drinkRules = [
  {
    test: /(wine|sangria|rose)/i,
    options: [
      { value: 'glass_200ml', label: 'Glass (200 ml)', multiplier: 1 },
      { value: 'carafe_500ml', label: 'Carafe (500 ml)', multiplier: 2.3 },
      { value: 'bottle_750ml', label: 'Bottle (750 ml)', multiplier: 3.4 },
    ],
  },
  {
    test: /(latte|cappuccino|hot chocolate|cold brew|espresso|coffee)/i,
    options: [
      { value: 'cup_250ml', label: 'Cup (250 ml)', multiplier: 1 },
      { value: 'large_cup_350ml', label: 'Large Cup (350 ml)', multiplier: 1.3 },
      { value: 'flask_1l', label: 'Flask (1 L)', multiplier: 3.6 },
    ],
  },
]

const fallbackOptions = [
  { value: 'plate_450g', label: 'Plate (450 g)', multiplier: 1 },
  { value: 'pack_750g', label: 'Pack (750 g)', multiplier: 1.6 },
  { value: 'tray_2kg', label: 'Tray (2 kg)', multiplier: 3.8 },
]

const beverageFallback = [
  { value: 'glass_330ml', label: 'Glass (330 ml)', multiplier: 1 },
  { value: 'bottle_500ml', label: 'Bottle (500 ml)', multiplier: 1.4 },
  { value: 'pitcher_1l', label: 'Pitcher (1 L)', multiplier: 2.8 },
]

const getUnitOptionsForItem = (menuItem) => {
  const name = menuItem?.name || ''
  const category = menuItem?.category || ''

  const matchedCommon = commonRules.find((rule) => rule.test.test(name))
  if (matchedCommon) return matchedCommon.options

  if (category === DRINK_CATEGORY) {
    const matchedDrink = drinkRules.find((rule) => rule.test.test(name))
    return matchedDrink ? matchedDrink.options : beverageFallback
  }

  return fallbackOptions
}

const findUnitOption = (menuItem, value) => {
  const options = getUnitOptionsForItem(menuItem)
  return options.find((option) => option.value === value) || options[0]
}

module.exports = { getUnitOptionsForItem, findUnitOption }
