import express, { Request, Response } from 'express'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  forgotPassWordTokenValidator,
  forgotPassWordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordTokenValidator,
  updateMeValidator
} from '~/middlewares/users.middlewares'
import {
  changePasswordController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  updateMeController,
  verifyEmailTokenController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import { wrapAsync } from '~/utils/handlers'
import { filterMiddleWare } from '~/middlewares/common.midlewares'
import { UpdateMeReqBody } from '~/models/schemas/requests/user.requests'
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

/*
desc: verify forgot password Token
route kiểm tra forgot_password_ token và còn hiệu lực không
path: users/verify-forgot-password
method: post
body:{
  forgot_password_token: string
}

*/

userRouter.post(
  '/verify-forgot-password',
  forgotPassWordTokenValidator, //kiểm tra forrgot_password_token
  wrapAsync(verifyForgotPasswordTokenController) //xử lý logic
)

/* desc: reset-password
path: users/reset-password
method: post
body: {
  password: string,
  confirm_password: string,
  forgot_password_token: string
}
*/
userRouter.post(
  '/reset-password',
  forgotPassWordTokenValidator, // kiểm tra forgot_password_token
  resetPasswordTokenValidator, //kiểm tra password, confirm_password, forgot_password_token
  wrapAsync(resetPasswordController) // tiến hành đổi mk
)

/*desc: get me: get my profile
path: users/ me
method: post

headers:{
    Authorization: 'Bearer <access_token>}
*/
userRouter.post(
  '/me',
  accessTokenValidator, //
  wrapAsync(getMeController)
)

/*
des: update profile của user
path: '/me'
method: patch
Header: {Authorization: Bearer <access_token>}
body: {
  name?: string
  date_of_birth?: Date
  bio?: string // optional
  location?: string // optional
  website?: string // optional
  username?: string // optional
  avatar?: string // optional
  cover_photo?: string // optional}
*/

userRouter.patch(
  '/me',
  //cần 1 midlewere lọc ra những gì cần lấy trong req.body
  filterMiddleWare<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
  ]),
  accessTokenValidator, //
  updateMeValidator,
  wrapAsync(updateMeController)
)

/*
desc: change-password
path: users/change-password
method: put // dùng post cũng được
head: {
    Authorization: 'Bearer <access_token>'
}
body:{
    old_password: string,
    new_password: string,
    confirm_password: string
}
*/

userRouter.put(
  '/change-password', //
  accessTokenValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController)
)
/*
desc: refresh_token
path: users/refresh-token
method: post
body:{
  refresh_token: string
}
*/
userRouter.post(
  '/refresh-token', //
  refreshTokenValidator,
  wrapAsync(refreshTokenController)
)
export default userRouter
