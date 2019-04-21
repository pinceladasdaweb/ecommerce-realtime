'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Category = use('App/Models/Category')
const Database = use('Database')

/**
 * Resourceful controller for interacting with categories
 */
class CategoryController {
  /**
   * Show a list of all categories.
   * GET categories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, pagination }) {
    const title = request.input('title')
    const query = Category.query()

    if (title) {
      query.where('title', 'LIKE', `%${title}%`)
    }

    const categories = await query.paginate(pagination.page, pagination.perPage)

    return response.send(categories)
  }

  /**
   * Create/save a new category.
   * POST categories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { title, description, image_id } = request.all()
      const category = await Category.create({ title, description, image_id }, trx)

      await trx.commit()

      return response.status(201).send({ data: category })
    } catch(error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error creating category'
      })
    }
  }

  /**
   * Display a single category.
   * GET categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ params, request, response }) {
    try {
      const category = await Category.findOrFail(params.id)

      return response.send(category)
    } catch (error) {
      return response.status(404).send({
        status: 'error',
        message: 'Category does not exist'
      })
    }
  }

  /**
   * Update category details.
   * PUT or PATCH categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { title, description, image_id } = request.all()
      const category = await Category.findOrFail(params.id)

      category.merge({ title, description, image_id })

      await category.save(trx)
      await trx.commit()

      return response.send(category)
    } catch(error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error updating category'
      })
    }
  }

  /**
   * Delete a category with id.
   * DELETE categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const category = await Category.find(params.id)

      await category.delete(trx)
      await trx.commit()

      return response.status(204).send()
    } catch (error) {
      await trx.rollback()
      return response.status(400).send({
        status: 'error',
        message: 'There was an error deleting the category'
      })
    }
  }
}

module.exports = CategoryController
