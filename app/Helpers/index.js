'use strict'

const crypto = use('crypto')
const Helpers = use('Helpers')

/**
* Generate random alphanumeric string
*
* @param { int } length - The length of the string
* @return { string }    - The Result
*/
const str_random = async (length = 40) => {
  let string = ''
  let len = string.length

  if (len < length) {
    let size = length - len
    let bytes = await crypto.randomBytes(size)
    let buffer = Buffer.from(bytes)

    string += buffer
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substr(0, size)
  }
  return string
}

const manage_single_upload = async (file, path = null) => {
  path = path ? path : Helpers.publicPath('uploads')
  const random_name = await str_random(30)
  const filename = `${new Date().getTime()}-${random_name}.${file.subtype}`

  await file.move(path, {
    name: filename
  })

  return file
}

const manage_multiple_uploads = async (fileJar, path = null) => {
  path = path ? path : Helpers.publicPath('uploads')
  const success = []
  const errors = []

  await Promise.all(
    fileJar.files.map(async file => {
      let random_name = await str_random(30)
      let filename = `${new Date().getTime()}-${random_name}.${file.subtype}`

      await file.move(path, {
        name: filename
      })

      if (file.moved()) {
        success.push(file)
      } else {
        errors.push(file.error())
      }
    })
  )

  return { success, errors }
}

module.exports = {
  str_random,
  manage_single_upload,
  manage_multiple_uploads
}