'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Product = use('App/Models/Product')
const Database = use('Database')

/**
 * Resourceful controller for interacting with products
 */
class ProductController {
  /**
   * Show a list of all products.
   * GET products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, pagination }) {
    const name = request.input('name')
    const query = Product.query()

    if (name) {
      query.where('name', 'LIKE', `%${name}%`)
    }

    const products = await query.paginate(pagination.page, pagination.perPage)

    return response.send(products)
  }

  /**
   * Create/save a new product.
   * POST products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { name, description, price, image_id } = request.all()
      const product = await Product.create({ name, description, price, image_id }, trx)

      await trx.commit()

      return response.status(201).send({ data: product })
    } catch(error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error creating product'
      })
    }
  }

  /**
   * Display a single product.
   * GET products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ params, request, response }) {
    try {
      const product = await Product.findOrFail(params.id)

      return response.send({ data: product })
    } catch (error) {
      return response.status(404).send({
        status: 'error',
        message: 'Product does not exist'
      })
    }
  }

  /**
   * Update product details.
   * PUT or PATCH products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { name, description, price, image_id } = request.all()
      const product = await Product.findOrFail(params.id)

      product.merge({ name, description, price, image_id })

      await product.save(trx)
      await trx.commit()

      return response.send({ data: product })
    } catch(error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error updating product'
      })
    }
  }

  /**
   * Delete a product with id.
   * DELETE products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const product = await Product.find(params.id)

      await product.delete(trx)
      await trx.commit()

      return response.status(204).send()
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        status: 'error',
        message: 'There was an error deleting the product'
      })
    }
  }
}

module.exports = ProductController
