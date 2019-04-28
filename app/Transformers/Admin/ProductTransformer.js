'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const ImageTransformer = use('App/Transformers/Admin/ImageTransformer')

/**
 * ProductTransformer class
 *
 * @class ProductTransformer
 * @constructor
 */
class ProductTransformer extends BumblebeeTransformer {
  static get defaultInclude () {
    return ['image']
  }

  /**
   * This method is used to transform the data.
   */
  transform (product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price
    }
  }

  includeImage (product) {
    return this.item(product.getRelated('image'), ImageTransformer)
  }
}

module.exports = ProductTransformer
