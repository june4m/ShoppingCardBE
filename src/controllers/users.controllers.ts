import { Request, Response } from 'express'
import usersServices from '~/services/users.services'
//controller là handler có nhiệm vụ tập kết dữ liệu từ người dùng
// và phân phát vào các serveices đúng chỗ

//controller là nơi tập kết và xử lý logic cho các dữ liệu nhận được
//trong controller các dữ liệu đều phải clean

export const loginController = (req: Request, res: Response) => {
  //xử lý logic cho dữ liệu
  const { email, password } = req.body
  // lên database kiểm tra email và password là của users nào
  //xà lơ
  if (email === 'minhncse182968@fpt.edu.vn' && password === 'weArePiedTeam') {
    res.status(200).json({
      message: 'Login successfully!!!',
      data: {
        fname: 'Minh là người đẹp trai nhất',
        yob: 2004
      }
    })
  } else {
    res.status(401).json({
      message: 'Invalid email or password'
    })
  }
}

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  //gọi services và tạo user từ email và password trong req.body
  //  lưu user đó vào users collection của mongoDB
  try {
    const result = await usersServices.regiser({ email, password })
    res.status(201).json({
      message: 'Register succcessfully!!!',
      data: result
    })
  } catch (error) {
    res.status(422).json({
      message: 'Register failed!!!',
      error
    })
  }
}
