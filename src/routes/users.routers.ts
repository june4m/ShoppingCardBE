import express, { Request, Response } from 'express'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPassWordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import {
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  verifyEmailTokenController
} from '~/controllers/users.controllers'
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
/*
desc: verify email
sự kiện này diễn ra khi người dùng nhấn vào link có trong email của họ
thì evt sẽ được gửi lên server be thông qua req.query
path: users/verify-email/?email_verify_token=string
method: get
*/
userRouter.get(
  '/verify-email', //
  emailVerifyTokenValidator,
  wrapAsync(verifyEmailTokenController)
)

/*desc: resend email verify token
người dùng sẽ dùng chức năng này khi làm mất, lạc email
phải đăng nhập thì mới cho verify
headers{
    Athorization: 'Bearer <access_token>'
}
method: post 
path: users/resend-email-verify-token
*/

userRouter.post(
  '/resend-verify-email',
  accessTokenValidator, //
  wrapAsync(resendVerifyEmailController)
)

/*desc: forgot password
    Khi quên mật khẩu thì dùng chức năng này
    Path: users/forgot-password
    method: post
    body:{
        email: string
        
    }
 */
userRouter.post(
  '/forgot-password',
  forgotPassWordValidator, //
  wrapAsync(forgotPasswordController)
)
export default userRouter
