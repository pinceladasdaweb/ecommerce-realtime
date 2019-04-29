'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Database = use('Database')
const Order = use('App/Models/Order')
const Coupon = use('App/Models/Coupon')
const Discount = use('App/Models/Discount')
const Service = use('App/Services/Order/OrderService')
const Transformer = use('App/Transformers/Admin/OrderTransformer')
const Ws = use('Ws')

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
  async index ({ request, response, transform, pagination, auth }) {
    const client = await auth.getUser()
    const number = request.input('number')
    const query = Order.query()

    if (number) {
      query.where('id', `${number}`)
    }

    query.where('user_id', client.id)

    const orders = await query.orderBy('id', 'DESC').paginate(pagination.page, pagination.perPage)

    return transform.paginate(orders, Transformer)
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response, transform, auth }) {
    const trx = await Database.beginTransaction()

    try {
      const { items, status } = request.all()
      const client = await auth.getUser()

      let order = await Order.create({ user_id: client.id, status }, trx)
      const service = new Service(order, trx)

      if (items && items.length > 0) {
        await service.syncItems(items)
      }

      await trx.commit()

      order = await Order.find(order.id)
      order = await transform.include('items').item(order, Transformer)

      const topic = Ws.getChannel('notifications').topic('notifications')

      if (topic) {
        topic.broadcast('new:order', order)
      }

      return response.status(201).send({ data: order })
    } catch (error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error while placing your order.'
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
  async show ({ params, request, response, transform, auth }) {
    try {
      const client = await auth.getUser()
      let order = await Order.query().where('user_id', client.id).where('id', params.id).firstOrFail()

      order = await transform.item(order, Transformer)

      return response.send({ data: order })
    } catch (error) {
      return response.status(404).send({
        status: 'error',
        message: 'Order does not exist'
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
  async applyDiscount ({ params, request, response, transform, auth }) {
    try {
      const { code } = request.all()
      const coupon = await Coupon.findByOrFail('code', code.toUpperCase())
      const client = await auth.getUser()
      let order = await Order.query().where('user_id', client.id).where('id', id).firstOrFail()
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

      order = await transform.include('items,discounts,coupons').item(order, Transformer)

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
