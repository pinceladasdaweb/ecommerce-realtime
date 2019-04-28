'use strict'

class AdminStoreCategory {
  get rules () {
    return {
      title: 'required',
      description: 'required'
    }
  }
}

module.exports = AdminStoreCategory
