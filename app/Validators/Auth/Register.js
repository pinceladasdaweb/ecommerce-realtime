'use strict'

class Register {
  get rules () {
    return {
      name: 'required',
      surname: 'required',
      email: 'required|email|unique:users,email',
      password: 'required|confirmed',
    }
  }

  get messages () {
    return {
      'name.required': 'Name is required.',
      'surname.required': 'Surname is required.',
      'email.required': 'Email is required.',
      'email.email': 'Invalid email.',
      'email.unique': 'Email already exists.',
      'password.required': 'Password is required.',
      'password.confirmed': 'The passwords do not match.'
    }
  }
}

module.exports = Register
