'use strict'

class AdminStoreUser {
  get rules () {
    const userID = this.ctx.params.id
    let rule = ''

    if (userID) {
      rule = `unique:users,email,id,${userID}`
    } else {
      rule = `unique:users,email|required`
    }

    return {
      email: rule,
      image_id: 'exists:images,id'
    }
  }
}

module.exports = AdminStoreUser
