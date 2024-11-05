import express, { Request, Response } from 'express'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import { wrapAsync } from '~/utils/handlers'
const userRouter = express.Router()

//Để loginValidator trong này là hợp lệ vì đây là middleware
//Khi người dùng truy cập vào localhost:3000/users/login thì hàm loginValidator sẽ chạy

/*
desc: Register a new user
Path: /register
Method: post
Body:{
    name: String,
    email: String,
    password: String,
    confirm_password: String,
    date_of_birth: String có dạng ISO8601
}
*/
//next mà trong đó có bug thì nó sẽ đưa xuống handle cuối cùng
//throw có 1 nhược điểm k chạy trên đc async thì phải dùng trycatch next
//!Throw trong async ko được
//!mặc định: server rớt mạng thì throw và dùng trycatch để next
userRouter.post('/register', registerValidator, wrapAsync(registerController))

/*desc: login
path: users/login
method: post
body:{
    email: string,
    password: string
}

*/
userRouter.post('/login', loginValidator, wrapAsync(loginController))

/*desc: logout
users: /logout
method: post
header:{
    Authorization: 'Bearer <access_token>'
}
body:{
    refresh_token: string
}
*/
// tách ra access và refresh tại vì mình sử dụng accesss nhiều hơn
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))
export default userRouter
