'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const ProductTransformer = use('App/Transformers/Admin/ProductTransformer')

/**
 * OrderItemTransformer class
 *
 * @class OrderItemTransformer
 * @constructor
 */
class OrderItemTransformer extends BumblebeeTransformer {
  static get defaultInclude () {
    return ['product']
  }

  /**
   * This method is used to transform the data.
   */
  transform (order) {
    return {
      id: order.id,
      subtotal: order.subtotal,
      quantity: order.quantity
    }
  }

  includeProduct (order) {
    return this.item(order.getRelated('product'), ProductTransformer)
  }
}

module.exports = OrderItemTransformer
