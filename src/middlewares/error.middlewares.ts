import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatus } from '~/models/schemas/Errors'
export const defaultErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  //lỗi từ mọi nguồn đổ về đây
  //Được chia làm 2 dạng ErrorWithStatus và phần còn lại
  if (error instanceof ErrorWithStatus) {
    res.status(error.status).json(omit(error, ['status']))
  } else {
    //khi error là những lỗi còn lại, có rất nhiều thông tin lạ, không có status
    Object.getOwnPropertyNames(error).forEach((key) => {
      Object.defineProperty(error, key, { enumerable: true })
    })
    //
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: error.message,
      errorInfor: omit(error, ['status'])
    })
  }
}
