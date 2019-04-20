'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Product extends Model {
  /**
  * Relationship between product and image
  */
  image () {
   return this.belongsTo('App/Models/Image')
  }

  /**
  * Relationship between product and images gallery
  */
  images () {
   return this.belongsToMany('App/Models/Image')
  }

  /**
  * Relationship between product and categories
  */
  categories () {
    return this.belongsToMany('App/Models/Category')
  }

  /**
  * Relationship between product and coupons
  */
  coupons () {
    return this.belongsToMany('App/Models/Coupon')
  }
}

module.exports = Product
