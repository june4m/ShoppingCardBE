//import các interface của express giúp em mô tả
import { error } from 'console'
import { verify } from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { checkSchema, ParamSchema, validationResult } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { values } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/schemas/Errors'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

//midleware là handler có nhiệm vụ kiểm tra các dữ liệu mà người dùng
//gửi lên thông qua request
// middleware đảm nhận vai trò kiểm tra dữ liệu đủ và đúng kiểu

//bay giờ mình sẽ mô phỏng chức năng đăng nhập
//nếu 1 người dùng muốn đăng nhập họ sẽ gửi lên email và password
//thông qua req.body
//middleware không được truy cập vào database, đây là tầng kiểm tra dữ liệu xem họ có đưa đủ không, và kiểm tra định dạng
//đủ và chuẩn định dạng chứ không được đụng vào database

//Export bình thường vì cùng tên với file
const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
      // returnScore: true
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  }
}
const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
      // returnScore: true
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      //value chính là confirm_password
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      } else {
        return true
      }
    }
  }
}

const forgotPassswordTokenSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
  },
  custom: {
    options: async (value: string, { req }) => {
      try {
        //value chính là forgot_password_token nên kiểm tra luôn
        const decode_forgot_password_token = await verifyToken({
          token: value,
          privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        ;(req as Request).decode_forgot_password_token = decode_forgot_password_token
      } catch (error) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNAUTHORIZED, //401
          message: (error as JsonWebTokenError).message
        })
      }
      //
      return true // khi kiểm tra thành công
    }
  }
}
const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING //Tương tự sửa các lỗi khác như vậy thay vì gửi message
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  }
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    }
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING //messages.ts thêm IMAGE_URL_MUST_BE_A_STRING: 'Image url must be a string'
  },
  trim: true, //nên đặt trim dưới này thay vì ở đầu
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_LESS_THAN_400 //messages.ts thêm IMAGE_URL_LENGTH_MUST_BE_LESS_THAN_400: 'Image url length must be less than 400'
  }
}
//PARAMSCHEMA
export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: true,
        trim: true
      },
      password: passwordSchema,

      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: true,
        trim: true
      },
      password: passwordSchema
    },
    ['body'] // điều này sẽ gửi req lên body
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            //value này là 'Bear '
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED, //401
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
              })
            }
            //người dùng có gửi lên access_token
            //verify access_token(so sánh chữ ký)
            try {
              //nếu đúng chữ ký tin vào payload có trong token
              const decode_authorization = await verifyToken({
                token: access_token,
                privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              //decode_authorization là payload của access_token
              //decode_authorization có user_id và token_type
              //*cất payload vào req tại vì cái hàm sau khi sử dụng xong sẽ bị mất còn req đi qua các tầng middleware được
              ;(req as Request).decode_authorization = decode_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED, //401
                message: (error as JsonWebTokenError).message
              })
            }
            return true //hoàn thành test
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            //value này là refresh_token luôn, nên verify(so chữ ký luôn)
            try {
              const decode_refresh_token = await verifyToken({
                token: value,
                privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
              })
              //value là refresh_token, verify xong đc decode_refresh_token là payload
              //lưu vào req để xài ở các tầng khác
              ;(req as Request).decode_refresh_token = decode_refresh_token
            } catch (error) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED, //401
                message: (error as JsonWebTokenError).message
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

//viết hàm kiểm tra email_verify_token

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            //value là email_verify_token luôn, không cần tìm, kiểm tra luôn
            try {
              const decode_email_verify_token = await verifyToken({
                token: value,
                privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              // nếu mã hóa thành công thì lưu vào req dùng để ở các chỗ khác
              ;(req as Request).decode_email_verify_token = decode_email_verify_token
            } catch (error) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED, //401
                message: (error as JsonWebTokenError).message
              })
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)

export const forgotPassWordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: true,
        trim: true
      }
    },
    ['body']
  )
)

export const forgotPassWordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPassswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordTokenValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)

//updateMeValidator sẽ có

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true, //đc phép có hoặc k
        ...nameSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      date_of_birth: {
        optional: true, //đc phép có hoặc k
        ...dateOfBirthSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING //messages.ts thêm BIO_MUST_BE_A_STRING: 'Bio must be a string'
        },
        trim: true, //trim phát đặt cuối, nếu k thì nó sẽ lỗi validatior
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm BIO_LENGTH_MUST_BE_LESS_THAN_200: 'Bio length must be less than 200'
        }
      },
      //giống bio
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING ////messages.ts thêm LOCATION_MUST_BE_A_STRING: 'Location must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm LOCATION_LENGTH_MUST_BE_LESS_THAN_200: 'Location length must be less than 200'
        }
      },
      //giống location
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING //messages.ts thêm WEBSITE_MUST_BE_A_STRING: 'Website must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },

          errorMessage: USERS_MESSAGES.WEBSITE_LENGTH_MUST_BE_LESS_THAN_200 //messages.ts thêm WEBSITE_LENGTH_MUST_BE_LESS_THAN_200: 'Website length must be less than 200'
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING //messages.ts thêm USERNAME_MUST_BE_A_STRING: 'Username must be a string'
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USERS_MESSAGES.USERNAME_LENGTH_MUST_BE_LESS_THAN_50 //messages.ts thêm USERNAME_LENGTH_MUST_BE_LESS_THAN_50: 'Username length must be less than 50'
        },
        custom: {
          options: (value: string, { req }) => {
            //value chính là username
            if (!REGEX_USERNAME.test(value)) {
              throw new Error(USERS_MESSAGES.USERNAME_IS_INVALID)
            }
            return true
          }
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: passwordSchema,
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)
