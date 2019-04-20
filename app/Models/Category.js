'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Category extends Model {
  /**
  * Relationship between categories and images
  */
  image () {
    return this.belongsTo('App/Models/Image')
  }

  /**
  * Relationship between categories and products
  */
  products () {
    return this.belongsToMany('App/Models/Product')
  }
}

module.exports = Category
