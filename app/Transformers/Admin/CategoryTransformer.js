'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')
const ImageTransformer = use('App/Transformers/Admin/ImageTransformer')

/**
 * CategoriesTransformer class
 *
 * @class CategoriesTransformer
 * @constructor
 */
class CategoriesTransformer extends BumblebeeTransformer {
  static get defaultInclude () {
    return ['image']
  }

  /**
  * This method is used to transform the data.
  */
  transform (category) {
    return {
      id: category.id,
      title: category.title,
      description: category.description
    }
  }

  includeImage (category) {
    return this.item(category.getRelated('image'), ImageTransformer)
  }
}

module.exports = CategoriesTransformer
