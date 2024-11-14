import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import path from 'path'
export const uploadSingleImageController = async (
  req: Request, //
  res: Response,
  next: NextFunction
) => {
  //_dirname: đường dẫn đến foler đang chạy file này
  //path.resolve('uploads'): đường dẫn đến thư mục mà anh muốn lưu trữ
  //tạo cái khung để khi người dùng gửi file lên sẽ bị mình dùng khung đó để kiểm tra(ép kiểu)
  //   console.log(path.resolve('uploads'))
  const from = formidable({
    maxFiles: 1,
    maxFileSize: 1024 * 300, //1 hình thì tối đa 300kb thôi
    keepExtensions: true, // dữ lại đuôi của file để kiểm tra sau
    uploadDir: path.resolve('uploads')
  })
  //đã chuẩn bị xong form để kiểm tra các file rồi, giờ mình sẽ dùng
  //form để kiểm tra req người dùng gửi lên
  from.parse(req, (err, fields, files) => {
    //file là object chứa các file do người dùng gửi lên
    if (err) {
      throw err
    } else {
      res.json({
        messsage: 'Upload img successfully'
      })
    }
  })
}
