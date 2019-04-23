'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Coupon = use('App/Models/Coupon')
const Service = use('App/Services/Coupon/CouponService')
const Database = use('Database')

/**
 * Resourceful controller for interacting with coupons
 */
class CouponController {
  /**
   * Show a list of all coupons.
   * GET coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, pagination }) {
    const code = request.input('code')
    const query = Coupon.query()

    if (code) {
      query.where('code', 'LIKE', `%${code}%`)
    }

    const coupons = await query.paginate(pagination.page, pagination.perPage)

    return response.send(coupons)
  }

  /**
   * Create/save a new coupon.
   * POST coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const trx = await Database.beginTransaction()

    try {
       let can_use = {
        client: false,
        product: false
      }

      const { code, discount, valid_from, valid_until, quantity, type, recursive, users, products } = request.all()
      const coupon = await Coupon.create({ code, discount, valid_from, valid_until, quantity, type, recursive }, trx)
      const service = new Service(coupon, trx)

      if (users && users.length > 0) {
        await service.syncUsers(users)
        can_use.client = true
      }

      if (products && products.length > 0) {
        await service.syncProducts(products)
        can_use.product = true
      }

      if (can_use.client && can_use.product) {
        coupon.can_use_for = 'product_client'
      } else if (can_use.product && !can_use.client) {
        coupon.can_use_for = 'product'
      } else if (!can_use.product && can_use.client) {
        coupon.can_use_for = 'client'
      } else {
        coupon.can_use_for = 'all'
      }

      await coupon.save(trx)
      await trx.commit()

      return response.status(201).send({ data: coupon })
    } catch (error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error creating coupon'
      })
    }
  }

  /**
   * Display a single coupon.
   * GET coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ params, request, response }) {
    try {
      const coupon = await Coupon.findOrFail(params.id)

      return response.send({ data: coupon })
    } catch (error) {
      return response.status(404).send({
        status: 'error',
        message: 'Coupon does not exist'
      })
    }
  }

  /**
   * Update coupon details.
   * PUT or PATCH coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      let can_use = {
        client: false,
        product: false
      }

      const { code, discount, valid_from, valid_until, quantity, type, recursive, users, products } = request.all()
      const coupon = await Coupon.findOrFail(params.id)

      coupon.merge({ code, discount, valid_from, valid_until, quantity, type, recursive, users, products })

      if (users && users.length > 0) {
        await service.syncUsers(users)
        can_use.client = true
      }

      if (products && products.length > 0) {
        await service.syncProducts(products)
        can_use.product = true
      }

      if (can_use.client && can_use.product) {
        coupon.can_use_for = 'product_client'
      } else if (can_use.product && !can_use.client) {
        coupon.can_use_for = 'product'
      } else if (!can_use.product && can_use.client) {
        coupon.can_use_for = 'client'
      } else {
        coupon.can_use_for = 'all'
      }

      await coupon.save(trx)
      await trx.commit()

      return response.send({ data: coupon })
    } catch (error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error updating coupon'
      })
    }
  }

  /**
   * Delete a coupon with id.
   * DELETE coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const coupon = await Coupon.find(params.id)

      await coupon.products().detach([], trx)
      await coupon.orders().detach([], trx)
      await coupon.users().detach([], trx)
      await coupon.delete(trx)
      await trx.commit()

      return response.status(204).send()
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        status: 'error',
        message: 'There was an error deleting the coupon'
      })
    }
  }
}

module.exports = CouponController
