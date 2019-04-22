'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Image = use('App/Models/Image')
const Database = use('Database')
const Helpers = use('Helpers')
const fs = use('fs')
const { manage_single_upload, manage_multiple_uploads } = use('App/Helpers')

/**
 * Resourceful controller for interacting with images
 */
class ImageController {
  /**
   * Show a list of all images.
   * GET images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, pagination }) {
    const images = await Image.query().orderBy('id', 'DESC').paginate(pagination.page, pagination.perPage)

    return response.send(images)
  }

  /**
   * Create/save a new image.
   * POST images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const fileJar = request.file('images', {
        types: ['image'],
        size: '2mb'
      })

      let images = []

      if (!fileJar.files) {
        const file = await manage_single_upload(fileJar)

        if (file.moved()) {
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype
          }, trx)

          images.push(image)

          await trx.commit()

          return response.status(201).send({ success: images, errors: {} })
        }

        return response.status(400).send({
          status: 'error',
          message: 'Could not process this image'
        })
      }

      let files = await manage_multiple_uploads(fileJar)

      await Promise.all(
        files.success.map(async file => {
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype
          }, trx)

          images.push(image)

          await trx.commit()
        })
      )

      return response.status(201).send({ success: images, errors: files.errors })      
    } catch (error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'An error ocurred on upload your imagey'
      })
    }
  }

  /**
   * Display a single image.
   * GET images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ params, request, response }) {
    try {
      const image = await Image.findOrFail(params.id)

      return response.send({ data: image })
    } catch (error) {
      return response.status(404).send({
        status: 'error',
        message: 'Image does not exist'
      })
    }
  }

  /**
   * Update image details.
   * PUT or PATCH images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const { original_name } = request.all()
      const image = await Image.findOrFail(params.id)

      image.merge({ original_name })

      await image.save(trx)
      await trx.commit()

      return response.send({ data: image })
    } catch (error) {
      await trx.rollback()

      return response.status(400).send({
        status: 'error',
        message: 'There was an error updating image'
      })
    }
  }

  /**
   * Delete a image with id.
   * DELETE images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
    const trx = await Database.beginTransaction()

    try {
      const image = await Image.find(params.id)
      const filePath = Helpers.publicPath(`uploads/${image.path}`)

      await fs.unlink(filePath, err => {
        if (err) throw err
      })

      await image.delete(trx)
      await trx.commit()

      return response.status(204).send()
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({
        status: 'error',
        message: 'There was an error deleting the image'
      })
    }
  }
}

module.exports = ImageController
