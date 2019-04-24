'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.group(() => {
  Route.resource('categories', 'CategoryController').apiOnly()
  Route.resource('products', 'ProductController').apiOnly()
  Route.resource('coupons', 'CouponController').apiOnly()
  Route.post('orders/:id/discount', 'OrderController.applyDiscount')
  Route.delete('orders/:id/discount', 'OrderController.removeDiscount')
  Route.resource('orders', 'OrderController').apiOnly()
  Route.resource('images', 'ImageController').apiOnly()
  Route.resource('users', 'UserController').apiOnly()
})
.prefix('v1/admin')
.namespace('Admin')
.middleware(['auth', 'is:(admin || manager)'])
