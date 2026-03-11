const fs = require('fs/promises')
const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const MenuItem = require('../models/MenuItem')
const { uploadImageBuffer, isCloudinaryConfigured } = require('../utils/cloudinary')
const { optimizeImageUrl, isCloudinaryUrl } = require('../utils/imageDelivery')
const { getMappedMealImageFileName, getMealImageFilePath } = require('../utils/mealImageMap')

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') })

const migrate = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI in environment variables.')
  }

  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    )
  }

  await mongoose.connect(process.env.MONGO_URI)

  const items = await MenuItem.find({}).sort({ createdAt: 1 })
  let migratedCount = 0
  let skippedCount = 0

  for (const item of items) {
    if (item.imagePublicId && isCloudinaryUrl(item.image)) {
      skippedCount += 1
      continue
    }

    const mappedFileName = getMappedMealImageFileName(item.name)
    if (!mappedFileName) {
      skippedCount += 1
      console.log(`Skipping ${item.name}: no local meal image mapping found.`)
      continue
    }

    const filePath = getMealImageFilePath(mappedFileName)
    const buffer = await fs.readFile(filePath)
    const uploadResult = await uploadImageBuffer(buffer, {
      folder: process.env.CLOUDINARY_MEAL_FOLDER || 'delxta/meals',
      resource_type: 'image',
      public_id: `meal-${item._id}`,
      overwrite: true,
      transformation: [
        { width: 1200, height: 900, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    })

    item.image = optimizeImageUrl(uploadResult.secure_url)
    item.imagePublicId = uploadResult.public_id
    await item.save()
    migratedCount += 1
    console.log(`Migrated ${item.name}`)
  }

  console.log(`Cloudinary meal migration complete. Migrated: ${migratedCount}, skipped: ${skippedCount}`)
}

migrate()
  .then(async () => {
    await mongoose.disconnect()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error(error.message)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
  })
