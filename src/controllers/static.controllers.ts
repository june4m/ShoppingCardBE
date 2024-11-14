import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
  //người dùng gửi lên filename bỏ qua param
  const { namefile } = req.params
  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, namefile), (error) => {
    if (error) {
      res.status((error as any).status).json({
        message: 'File not found'
      })
    }
  })
}
