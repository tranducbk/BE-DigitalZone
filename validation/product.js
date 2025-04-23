const Joi = require('joi');

// Schema for Variant Input
const variantSchema = Joi.object({
  color: Joi.string().required(),
  sale: Joi.number().required(),
  quantity: Joi.number().integer().min(0).required(),
  image: Joi.string().required()
});

// Schema for Product Model
const productSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().required(),
  brand: Joi.object({
    name: Joi.string().required(),
    image: Joi.string().required()
  }).required(),
  description: Joi.array().items(Joi.string()).required(),
  specifications: Joi.array().items(Joi.string()).required(),
  price: Joi.number().required(),
  sale: Joi.number().min(0).default(0),
  quantity: Joi.number().integer().min(0).default(0),
  rating: Joi.number().min(0).default(0),
  star1: Joi.number().integer().min(0).default(0),
  star2: Joi.number().integer().min(0).default(0),
  star3: Joi.number().integer().min(0).default(0),
  star4: Joi.number().integer().min(0).default(0),
  star5: Joi.number().integer().min(0).default(0),
  reviews: Joi.object().pattern(Joi.string(), Joi.number().min(0)), // Map validation
  variants: Joi.array().items(variantSchema).required()
});

// Validation function
const validateProduct = (product) => {
  return productSchema.validate(product, { abortEarly: false });
};

module.exports = { validateProduct };
