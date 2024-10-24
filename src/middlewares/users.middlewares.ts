//import các interface của express giúp em mô tả
import { Request, Response, NextFunction } from 'express'

//midleware là handler có nhiệm vụ kiểm tra các dữ liệu mà người dùng
//gửi lên thông qua requeest
// middleware đảm nhận vai trò kiểm tra dữ liệu đủ và đúng kiểu

//bay giờ mình sẽ mô phỏng chức năng đăng nhập
//nếu 1 người dùng muốn đăng nhập họ sẽ gửi lên email và password
//thông qua req.body
//middleware không được truy cập vào database, đây là tầng kiểm tra dữ liệu xem họ có đưa đủ không, và kiểm tra định dạng
//đủ và chuẩn định dạng chứ không được đụng vào database
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  //lấy thử email và password trong req.body mà người dùng gửi lên
  const { email, password } = req.body
  //kiểm tra xem email và password có được gửi lên không
  if (!email || !password) {
    res.status(422).json({
      message: 'Missing email or password!!!'
    })
  } else {
    next()
  }
}
//Export bình thường vì cùng tên với file
