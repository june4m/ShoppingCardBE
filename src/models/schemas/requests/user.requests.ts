import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enums'
import { ParsedQs } from 'qs'
// File này lưu các định nghĩa request mà người dùng gửi lên
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface LoginReqBody {
  email: string
  password: string
}
export interface TokenPayLoad extends JwtPayload {
  user_id: string
  token_type: TokenType
}
export interface LogoutReqBody {
  refresh_token: string
}

export interface VerifyEmailReqQuery extends ParsedQs {
  email_verify_token: string
}

export interface VerifyForgotPassWordTokenReqBody {
  forgot_password_token: string
}

export interface ResetPasswordReqBody {
  password: string
  confirm_password: string
  forgot_password_token: string
}

export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string
  bio?: string // optional
  location?: string // optional
  website?: string // optional
  username?: string // optional
  avatar?: string // optional
  cover_photo?: string // optional
}
