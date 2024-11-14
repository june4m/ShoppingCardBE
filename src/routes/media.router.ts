import { Router } from 'express'
import { uploadSingleImageController } from '~/controllers/medias.controllers'
import { wrapAsync } from '~/utils/handlers'
const mediaRouter = Router()

//làm 1 route cho người dùng upload file lên
mediaRouter.post('/upload-image', wrapAsync(uploadSingleImageController))
export default mediaRouter
