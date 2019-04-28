'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use('App/Models/User')
const Database = use('Database')

/**
 * Resourceful controller for interacting with users
 */
class UserController {
  /**
   * Show a list of all users.
   * GET users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, pagination }) {
    const name = request.input('name')
    const query = User.query()

    if (name) {
      query.where('name', 'LIKE', `%${name}%`).orWhere('surname', 'LIKE', `%${name}%`).orWhere('email', 'LIKE', `%${name}%`)
    }

    const users = await query.paginate(pagination.page, pagination.perPage)

    return response.send(users)
  }

  /**
   * Create/save a new user.
   * POST users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { name, surname, email, password, image_id } = request.all()
      const user = await User.create({ name, surname, email, password, image_id }, trx)

      await trx.commit()

      return response.status(201).send({ data: user })
    } catch(error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error creating user'
      })
    }
  }

  /**
   * Display a single user.
   * GET users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ params, request, response }) {
    try {
      const user = await User.findOrFail(params.id)

      return response.send({ data: user })
    } catch (error) {
      return response.status(404).send({
        status: 'error',
        message: 'User does not exist'
      })
    }
  }

  /**
   * Update user details.
   * PUT or PATCH users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { name, surname, email, password, image_id } = request.all()
      const user = await User.findOrFail(params.id)

      user.merge({ name, surname, email, password, image_id })

      await user.save(trx)
      await trx.commit()

      return response.send({ data: user })
    } catch(error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error updating user'
      })
    }
  }

  /**
   * Delete a user with id.
   * DELETE users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const user = await User.find(params.id)

      await user.delete(trx)
      await trx.commit()

      return response.status(204).send()
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        status: 'error',
        message: 'There was an error deleting the user'
      })
    }
  }
}

module.exports = UserController
