import User from '~/models/schemas/User.schema'
import databaseServices from './database.services'
import { LoginReqBody, RegisterReqBody, UpdateMeReqBody } from '~/models/schemas/requests/user.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import dotenv from 'dotenv'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/schemas/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { set, update } from 'lodash'
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

  async checkForgotPasswordToken({
    user_id,
    forgot_password_token
  }: {
    user_id: string //
    forgot_password_token: string
  }) {
    //tìm user với 2 thông tin trên, không có thì gửi, có thì return ra
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      forgot_password_token
    })
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID
      })
    }
    // Nếu có thì return user ra
    return user
  }
  async checkEmailVerified(user_id: string) {
    //tìm xem đã verify hay chưa
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      verify: UserVerifyStatus.Verified
    })
    //nếu tìm không có thì chưa verified
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBBIDEN, //403
        message: USERS_MESSAGES.USER_NOT_VERIFIED
      })
    }
    //nếu có user
    return user
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
        username: `user${user_id.toString()}`,
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

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseServices.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '', //sau khi đổi mật khẩu xong hãy xóa token
          updated_at: '$$NOW' // lưu trạng thái update bị thay đổi ở đoạn nào
        }
      }
    ])
  }
  async getMe(user_id: string) {
    const userInfor = await databaseServices.users.findOne(
      { _id: new ObjectId(user_id) }, //
      {
        //projection là phép chiếu bi // giống select trong sql
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return userInfor
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeReqBody }) {
    //user_id giúp mình tìm được user cần cập nhật
    //payload là những gì người dùng muốn mình cập nhật, mình không biết họ đã gửi lên những gì
    //nếu date_of_birth thì nó cần phải chuyển về dạng Date

    //kiểm tra nếu người dùng đưa lên date_of_birth thì nó sẽ là payload.date_of_birth còn không nó chỉ là payload
    const _payload = payload.date_of_birth //
      ? { ...payload, date_of_birth: new Date(payload.date_of_birth) }
      : payload
    //nếu người dùng cập nhật username thì nó phải unique
    if (_payload.username) {
      const isDup = await databaseServices.users.findOne({ username: _payload.username })
      if (isDup) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          message: USERS_MESSAGES.USERNAME_ALREADY_EXISTS
        })
      }
    }
    //nếu qua hết thì cập nhật
    const userInfor = await databaseServices.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) }, //
      [
        {
          $set: {
            ..._payload, // update toàn bộ tất cả những gì payload có
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after', //update xong đưa cho người dùng xem luôn và không phải đưa hết thông tin cho người dùng mà hãy chặn 1 số thông tin
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return userInfor // trả ra để người dùng xem
  }

  async changePassword({
    user_id,
    old_password,
    password
  }: {
    user_id: string
    old_password: string
    password: string
  }) {
    //tìm user bằng username và old_password
    const user = await databaseServices.users.findOne({
      _id: new ObjectId(user_id),
      password: hashPassword(old_password)
    })
    // kiểm tra nếu không có user thì ném ra thông báo
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    //nếu có thì cập nhật lại password
    //cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi

    await databaseServices.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            password: hashPassword(password),
            updated_at: '$$NOW'
          }
        }
      ]
      //nếu bạn muốn ngta đổi mk xong tự động đăng nhập luôn thì trả về access_token và refresh_token
      //ở đây mình chỉ cho ngta đổi mk thôi, nên trả về message
    )
    return {
      message: USERS_MESSAGES.CHANGEE_PASSWORD_SUCCESS
    }
  }
  async refreshToken({
    user_id,
    refresh_token //
  }: {
    user_id: string
    refresh_token: string
  }) {
    //tạo ac và rf mới
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken(user_id),
      this.signRefreshToken(user_id)
    ])
    //lưu rf mới
    await databaseServices.refresh_tokens.insertOne(
      new RefreshToken({
        token: new_refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    //xóa rf cũ
    await databaseServices.refresh_tokens.deleteOne({ token: refresh_token })

    //ném ra rf và ac mới cho người dùng
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }
}

//tạo instance
const usersServices = new UsersServices()
export default usersServices
