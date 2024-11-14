import express, { Router } from 'express'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { uploadImageController } from '~/controllers/medias.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
const mediaRouter = Router()

//làm 1 route cho người dùng upload file lên
mediaRouter.post('/upload-image', accessTokenValidator, wrapAsync(uploadImageController))
//mediaRouter.use('/', express.static(UPLOAD_IMAGE_DIR))

export default mediaRouter
