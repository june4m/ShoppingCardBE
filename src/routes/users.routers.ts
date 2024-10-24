import express from 'express'
import { loginValidator } from '~/middlewares/users.middlewares'
import { loginController, registerController } from '~/controllers/users.controllers'
const userRouter = express.Router()

//Để loginValidator trong này là hợp lệ vì đây là middleware
//Khi người dùng truy cập vào localhost:3000/users/login thì hàm loginValidator sẽ chạy
userRouter.post('/login', loginValidator, loginController)
//phát triển tính năng đăng ký register
//users/register  req.body {email, password}
userRouter.post('/register', registerController)
export default userRouter
