import { Request } from 'express'
import { TokenPayLoad } from './models/schemas/requests/user.requests'
declare module 'express' {
  interface Request {
    decode_authorization?: TokenPayLoad
    decode_refresh_token?: TokenPayLoad
  }
}
