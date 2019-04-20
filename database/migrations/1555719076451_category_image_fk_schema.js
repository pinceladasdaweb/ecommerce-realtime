'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CategoryImageFkSchema extends Schema {
  up () {
    this.table('categories', (table) => {
      // alter table
      table.foreign('image_id').references('id').inTable('images').onDelete('cascade')
    })
  }

  down () {
    this.table('categories', (table) => {
      // reverse alternations
      table.dropForeign('image_id')
    })
  }
}

module.exports = CategoryImageFkSchema
