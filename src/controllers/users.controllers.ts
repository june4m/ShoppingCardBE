import { NextFunction, Request, Response } from 'express'
import {
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayLoad,
  UpdateMeReqBody,
  VerifyEmailReqQuery,
  VerifyForgotPassWordTokenReqBody
} from '~/models/schemas/requests/user.requests'
import usersServices from '~/services/users.services'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { ErrorWithStatus } from '~/models/schemas/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enums'
import { Verify } from 'crypto'
import exp from 'constants'
//controller là handler có nhiệm vụ tập kết dữ liệu từ người dùng
// và phân phát vào các serveices đúng chỗ

//controller là nơi tập kết và xử lý logic cho các dữ liệu nhận được
//trong controller các dữ liệu đều phải clean

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body
  //gọi services và tạo user từ email và password trong req.body
  //  lưu user đó vào users collection của mongoDB

  //kiểm tra email có tồn tại chưa | có ai trùng email này chưa | email có bị trùng không?
  const isDup = await usersServices.checkEmailExist(email)
  if (isDup) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY, //422
      message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS
    })
  }
  const result = await usersServices.regiser(req.body)
  res.status(201).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    data: result
  })
}

export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response,
  next: NextFunction
) => {
  //Dùng email và password để tìm user đang sở hữu chúng
  //nếu có user đó tồn tài nghĩa là đăng nhập thành công
  const { email, password } = req.body
  //vào database tìm
  const result = await usersServices.login({ email, password })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result // là acc và rf
  })
}
export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response,
  next: NextFunction
) => {
  //so user_id trong payload của ac và rf có phải là 1 không?
  const { refresh_token } = req.body
  const { user_id: user_id_at } = req.decode_authorization as TokenPayLoad
  const { user_id: user_id_rf } = req.decode_refresh_token as TokenPayLoad
  if (user_id_at !== user_id_rf) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, //422
      message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
    })
  }
  //nếu khớp mã, thì kiểm tra xem rf trong database  hay không?
  await usersServices.checkRefreshToken({
    user_id: user_id_rf,
    refresh_token
  })
  //nếu có thì mình mới logout(xóa rfToken trong database)
  await usersServices.logout(refresh_token)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGOUT_SUCCESS
  })
}

export const verifyEmailTokenController = async (
  req: Request<ParamsDictionary, any, any, VerifyEmailReqQuery>,
  res: Response,
  next: NextFunction
) => {
  //khi họ bấm vào link họ sẽ gửi email_verify_token lên thông qua
  //req.query
  const { email_verify_token } = req.query
  const { user_id } = req.decode_email_verify_token as TokenPayLoad // không biết user có gửi lên  không nên phải định nghĩa rõ ra

  //kiểm tra xem trong database có user sở hữu là user_id trong payload
  //                                    và email_verify_token không
  const user = await usersServices.checkEmailVerifyToken({ user_id, email_verify_token })
  if (user.verify == UserVerifyStatus.Banned) {
    //nếu mà bị banned
    throw new ErrorWithStatus({
      status: HTTP_STATUS.UNAUTHORIZED, //402
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_BANNED
    })
  } else {
    //chưa verify thì mình verify
    //sau khi verify xong thì
    const result = await usersServices.verifyEmail(user_id)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
      result // ac và rf
    })
  }
  //kiểm tra xem user tìm được bị banned chưa, chưa thì mới verify
}

export const resendVerifyEmailController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  //dùng user_id tìm user đó
  const { user_id } = req.decode_authorization as TokenPayLoad
  const user = await usersServices.findUserById(user_id)
  if (!user) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.verify == UserVerifyStatus.Verified) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.OK,
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_VERIFIED
    })
  } else if (user.verify == UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.OK,
      message: USERS_MESSAGES.EMAIL_HAS_BEEN_BANNED
    })
  } else {
    //chưa verify thì resend
    await usersServices.resendEmailVerify(user_id)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_TOKEN_SUCCESS
    })
  }
  //kiểm tra user đó có verify hay bị banned không ?
  //nếu không thì mới resendEmailVerify
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body
  const hasUser = await usersServices.checkEmailExist(email)
  if (!hasUser) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  } else {
    await usersServices.forgotPassword(email)
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    })
  }
}

export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPassWordTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  //người dùng gửi lên forgot_password_token
  const { forgot_password_token } = req.body
  //mình đã xác thực mã rồi
  //nhưng  mà chỉ thực thi khi forrgot_password_token còn hiệu lực với user
  //nên mình cần tìm user thông qua user_id
  const { user_id } = req.decode_forgot_password_token as TokenPayLoad
  //tìm user nào đang có 2 thông tin trên, nếu không tìm được nghĩa là forrgot_password_token
  // đã được thay thế hoặc đã bị xóa rồi
  await usersServices.checkForgotPasswordToken({ user_id, forgot_password_token })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  //người dùng gửi lên forgot_password_token
  const { forgot_password_token, password } = req.body
  //mình đã xác thực mã rồi
  //nhưng  mà chỉ thực thi khi forrgot_password_token còn hiệu lực với user
  //nên mình cần tìm user thông qua user_id
  const { user_id } = req.decode_forgot_password_token as TokenPayLoad
  //tìm user nào đang có 2 thông tin trên, nếu không tìm được nghĩa là forrgot_password_token
  // đã được thay thế hoặc đã bị xóa rồi
  await usersServices.checkForgotPasswordToken({ user_id, forgot_password_token })
  //nếu còn hiệu lực thì tiến hành cập nhật password
  await usersServices.resetPassword({ user_id, password })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
  })
}

export const getMeController = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
  //người dùng đã gửi lên access token để xác thực họ đã đăng nhập và yêu cầu thông tin từ mình
  const { user_id } = req.decode_authorization as TokenPayLoad
  //dùng user_id tìm user
  const userInfor = await usersServices.getMe(user_id)
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    userInfor
  })
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>, //
  res: Response,
  next: NextFunction
) => {
  //người dùng truyền lên access token => user_id
  const { user_id } = req.decode_authorization as TokenPayLoad
  //nội dung mà người dùng muốn cập nhật
  const payload = req.body
  //kiểm tra user này đã verify hay chưa
  const isVerify = await usersServices.checkEmailVerified(user_id)
  //đã verify rồi thì mình tiến hành cập nhật xong thì trả ra thông tin user sau cập nhật
  const userInfor = await usersServices.updateMe({ user_id, payload })
  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.UPDATE_PROFILE_SUCCESS,
    userInfor
  })
}
