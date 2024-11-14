import { pick } from 'lodash'
import { Request, Response, NextFunction } from 'express'
//sử dụng generic để định nghĩa
export const filterMiddleWare = <T>(filterKeys: Array<keyof T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }
}
