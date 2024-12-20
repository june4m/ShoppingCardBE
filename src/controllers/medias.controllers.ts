import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import mediasServices from '~/services/medias.services'
export const uploadImageController = async (
  req: Request, //
  res: Response,
  next: NextFunction
) => {
  //_dirname: đường dẫn đến folder đang chạy file này
  //path.resolve('uploads'): đường dẫn đến thư mục mà anh muốn lưu trữ
  //tạo cái khung để khi người dùng gữi file lên sẽ bị mình dùng khung đó
  //để kiểm tra (ép kiểu)
  const infor = await mediasServices.handleUploadImage(req)
  //xử lý file
  res.json({
    message: 'upload img successfully',
    infor
  })
}

export const uploadVideoController = async (
  req: Request, //
  res: Response,
  next: NextFunction
) => {
  const infor = await mediasServices.handleUploadVideo(req)
  res.status(HTTP_STATUS.OK).json({
    message: 'upload video successfully',
    infor
  })
}
