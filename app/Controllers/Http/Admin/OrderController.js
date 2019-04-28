'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Order = use('App/Models/Order')
const Coupon = use('App/Models/Coupon')
const Discount = use('App/Models/Discount')
const Service = use('App/Services/Order/OrderService')
const Database = use('Database')

/**
 * Resourceful controller for interacting with orders
 */
class OrderController {
  /**
   * Show a list of all orders.
   * GET orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, pagination }) {
    const { status, id } = request.only(['status', 'id'])
    const query = Order.query()

    if (status && id) {
      query.where('status', status).orWhere('id', 'LIKE', `%${id}%`)
    } else if (status) {
      query.where('status', status)
    } else if (id) {
      query.where('id', 'LIKE', `%${id}%`)
    }
    
    const orders = await query.orderBy('id', 'DESC').paginate(pagination.page, pagination.perPage)

    return response.send(orders)
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { user_id, items, status } = request.all()
      const order = await Order.create({ user_id, status }, trx)
      const service = new Service(order, trx)

      if (items && items.length > 0) {
        await service.syncItems(items)
      }

      await trx.commit()

      return response.status(201).send({ data: order })
    } catch (error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error creating order'
      })
    }
  }

  /**
   * Display a single order.
   * GET orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ params, request, response }) {
    try {
      const order = await Order.findOrFail(params.id)

      return response.send({ data: order })
    } catch (error) {
      return response.status(404).send({
        status: 'error',
        message: 'Order does not exist'
      })
    }
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { user_id, items, status } = request.all()
      const order = await Order.findOrFail(params.id)

      order.merge({ user_id, status })

      const service = new Service(order, trx)

      await service.updateItems(items)
      await order.save(trx)
      await trx.commit()

      return response.send({ data: order })
    } catch (error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error updating order'
      })
    }
  }

  /**
   * Delete a order with id.
   * DELETE orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const order = await Order.find(params.id)

      await order.items().delete(trx)
      await order.coupons().delete(trx)
      await order.delete(trx)
      await trx.commit()

      return response.status(204).send()
    } catch (error) {
      await trx.rollback()

      return response.status(500).send({
        status: 'error',
        message: 'There was an error deleting the order'
      })
    }
  }

  /**
   * Apply discount on an order.
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async applyDiscount ({ params, request, response }) {
    try {
      const { code } = request.all()
      const coupon = await Coupon.findByOrFail('code', code.toUpperCase())
      const order = await Order.findOrFail(id)
      const discount = {}
      const info = {}

      const service = new Service(order)
      const canAddDiscount = await service.canApplyDiscount(coupon)
      const orderDiscounts = await order.coupons().getCount()

      const canApplyToOrder = orderDiscounts < 1 || (orderDiscounts >= 1 && coupon.recursive)

      if (canAddDiscount && canApplyToOrder) {
        discount = await Discount.findOrCreate({
          order_id: order.id,
          coupon_id: coupon.id
        })
        info.message = 'Coupon successfully applied'
        info.success = true
      } else {
        info.message = 'This coupon could not be applied'
        info.success = false
      }

      return response.send({ order, info })
    } catch (error) {
      return response.status(400).send({
        status: 'error',
        message: 'Error applying coupon'
      })
    }
  }

  /**
   * Remove discount on an order.
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async removeDiscount ({ request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { discount_id } = request.all()
      const discount = await Discount.findOrFail(discount_id)

      await discount.delete(trx)
      await trx.commit()

      return response.status(204).send()
    } catch (error) {
      await trx.rollback()

      return response.status(500).send({
        status: 'error',
        message: 'Error removing discount'
      })
    }
  }
}

module.exports = OrderController
