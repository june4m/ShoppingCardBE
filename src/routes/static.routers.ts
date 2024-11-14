import { Router } from 'express'
import { serveImageController, serveVideoStreamController } from '~/controllers/static.controllers'
const staticRouter = Router()

staticRouter.get('/image/:namefile', serveImageController)
//:namefile là param
staticRouter.get('/video/:namefile', serveVideoStreamController)

export default staticRouter
