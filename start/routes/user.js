'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.get('v1/me', 'UserController.me').as('me').middleware('auth')
