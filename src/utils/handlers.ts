//file này lưu hàm wrapAsync
//WrapAsync nhận vào 'Req Handler A'
//sau đó trả ra 'Req Handler B' có cấu trúc try catch next
//và chạy 'Req Handler A' bên trong try

import { NextFunction, Request, RequestHandler, Response } from 'express'

export const wrapAsync = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
