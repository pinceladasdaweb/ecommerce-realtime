'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProductImageFkSchema extends Schema {
  up () {
    this.table('products', (table) => {
      // alter table
      table.foreign('image_id').references('id').inTable('images').onDelete('cascade')
    })
  }

  down () {
    this.table('products', (table) => {
      // reverse alternations
      table.dropForeign('image_id')
    })
  }
}

module.exports = ProductImageFkSchema
