import User from '~/models/schemas/User.schema'
import databaseServices from './database.services'
import { LoginReqBody, RegisterReqBody } from '~/models/schemas/requests/user.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import dotenv from 'dotenv'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/schemas/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { update } from 'lodash'
dotenv.config()
class UsersServices {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: { expiresIn: process.env.ACESS_TOKEN_EXPIRE_IN }
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN }
    })
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN }
    })
  }
  async checkEmailExist(email: string) {
    //có 2 flow
    //C1: lên database lấy danh sách schema xuống và kiểm tra ( cách này nguy hiểm không làm như này được)
    //C2: lên database tìm user đang sở hữu email này
    const user = await databaseServices.users.findOne({ email })
    return Boolean(user)
  }

  async checkRefreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    const refreshToken = await databaseServices.refresh_tokens.findOne({
      user_id: new ObjectId(user_id),
      token: refresh_token
    })
    if (!refreshToken) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED, //401
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID
      })
    }
    return refreshToken
  }

  async checkEmailVerifyToken({
    user_id,
    email_verify_token
  }: {
    user_id: string //
    email_verify_token: string
  }) {
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      email_verify_token
    })
    //nếu tìm không được thì throw lỗi luôn
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND, //404
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return user //để có tính tái sử dụng cao thay vì return true
  }
  async findUserById(user_id: string) {
    return await databaseServices.users.findOne({ _id: new ObjectId(user_id) })
  }

  async findUserByEmail(email: string) {
    return await databaseServices.users.findOne({ email })
  }
  async regiser(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken(user_id.toString())
    const result = await databaseServices.users.insertOne(
      new User({
        _id: user_id,
        email_verify_token,
        ...payload,
        password: hashPassword(payload.password),
        date_of_birth: new Date(payload.date_of_birth) //overwrite: ghi đè lên
      })
    )
    //lấy

    //tạo access và refresh token
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id.toString()),
      this.signRefreshToken(user_id.toString())
    ])

    //gửi qua email
    console.log(`
      Nội dung Email xác thực Email gồm:
        http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}
      `)

    await databaseServices.refresh_tokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async login({ email, password }: LoginReqBody) {
    //vào database tìm user sở hữu 2 thông tin này
    const user = await databaseServices.users.findOne({
      email,
      password: hashPassword(password)
    })
    //email và password không tìm được user => email và password sai
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY, // đây là mã 4222
        message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT
      })
    }
    //Nếu qua if thì nghĩa là có user => đúng
    //tạo ac và rf
    const user_id = user._id.toString()
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    //lưu rf token
    await databaseServices.refresh_tokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseServices.refresh_tokens.deleteOne({
      token: refresh_token
    })
  }

  async verifyEmail(user_id: string) {
    //dùng user_id tìm và cập nhật
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) }, //
      [
        {
          $set: {
            verify: UserVerifyStatus.Verified,
            email_verify_token: '',
            //update_at: new Date() => => 1 thằng gà xài mongo
            updated_at: '$$NOW' //mongo lập tức lấy ở lúc nó lưu vào thay vì để newDate() nó sẽ bị lệch thời gian
          }
        }
      ]
    )
    //tạo ac và rf
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    //lưu rf token
    await databaseServices.refresh_tokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      access_token,
      refresh_token
    }
  }
  async resendEmailVerify(user_id: string) {
    //ký
    const email_verify_token = await this.signEmailVerifyToken(user_id)
    //lưu
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user_id) }, //
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    //gửi
    console.log(`
      Nội dung Email xác thực Email gồm:
        http://localhost:3000/users/verify-email/?email_verify_token=${email_verify_token}
      `)
  }
  async forgotPassword(email: string) {
    const user = await databaseServices.users.findOne({ email })
    if (user) {
      const user_id = user._id
      const forgot_password_token = await this.signForgotPasswordToken(user_id.toString())
      await databaseServices.users.updateOne({ _id: user_id }, [
        {
          $set: {
            forgot_password_token,
            updated_at: '$$NOW'
          }
        }
      ])
      console.log(`
        Bấm vô đây để đổi mk:
        http://localhost:8000/reset-password/?forgot_password_token=${forgot_password_token}
        `)
    }
  }
}

//tạo instance
const usersServices = new UsersServices()
export default usersServices
